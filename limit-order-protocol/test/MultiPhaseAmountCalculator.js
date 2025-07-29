const { expect, time, assertRoughlyEqualValues } = require('@1inch/solidity-utils');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether } = require('./helpers/utils');
const { deploySwapTokens } = require('./helpers/fixtures');
const { buildOrder, signOrder, buildTakerTraits } = require('./helpers/orderUtils');
const { ethers } = require('hardhat');

describe('MultiPhaseAmountCalculator (integration)', function () {
    let maker, taker;

    before(async function () {
        [maker, taker] = await ethers.getSigners();
    });

    async function deployAndBuildOrder () {
        const { dai, weth, swap, chainId } = await deploySwapTokens();

        await dai.mint(maker, ether('100'));
        await dai.mint(taker, ether('100'));
        await weth.deposit({ value: ether('1') });
        await weth.connect(taker).deposit({ value: ether('1') });

        await dai.approve(swap, ether('100'));
        await dai.connect(taker).approve(swap, ether('100'));
        await weth.approve(swap, ether('1'));
        await weth.connect(taker).approve(swap, ether('1'));

        const TWAPCalculator = await ethers.getContractFactory('TWAPCalculator');
        const twap = await TWAPCalculator.deploy();
        await twap.waitForDeployment();
        const MultiPhase = await ethers.getContractFactory('MultiPhaseAmountCalculator');
        const multiPhase = await MultiPhase.deploy();
        await multiPhase.waitForDeployment();

        const MockOracle = await ethers.getContractFactory('MockV3Aggregator');
        const oracle = await MockOracle.deploy(8, ethers.parseUnits("3000", 8));
        await oracle.waitForDeployment();

        const now = await time.latest();
        const start = now + 60;
        const end = now + 600;

        const twapExtraData = ethers.AbiCoder.defaultAbiCoder().encode([
            "uint256", "uint256", "uint256", "uint256", "address", "uint8", "uint8"
        ], [start, 60, ether('1'), ether('10'), await oracle.getAddress(), 18, 6]);
        

        const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bool", "address", "tuple(uint256,uint256,address,bytes)[]"],
        [
            true,
            await oracle.getAddress(),
            [
            [start, end, await twap.getAddress(), twapExtraData]
            ]
        ]
        );

        const order = buildOrder({
            makerAsset: await dai.getAddress(),
            takerAsset: await weth.getAddress(),
            makingAmount: ether('10'),
            takingAmount: 0,
            maker: maker.address
        }, { 
            makingAmountData: ethers.solidityPacked(
                ['address','bytes'],
                [await multiPhase.getAddress(),extraData],
            ),
            takingAmountData: ethers.solidityPacked(
                ['address','bytes'],
                [await multiPhase.getAddress(),extraData],
            ),
        });

                   
        const signature = await signOrder(order, chainId, await swap.getAddress(), maker);

        const makerDaiBefore = await dai.balanceOf(maker);
        const takerDaiBefore = await dai.balanceOf(taker);
        const makerWethBefore = await weth.balanceOf(maker);
        const takerWethBefore = await weth.balanceOf(taker);

        return { dai, weth, swap, multiPhase, order, signature, oracle, start, end, makerDaiBefore, takerDaiBefore, makerWethBefore, takerWethBefore };
    }

    it('fills within active phase (makingAmount)', async function () {
        const { dai, weth, swap, multiPhase, order, signature, start, makerDaiBefore, takerDaiBefore, makerWethBefore, takerWethBefore } = await loadFixture(deployAndBuildOrder);

        await time.increaseTo(start + 180);

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
            threshold: ether('3200')
        });

        await expect(
            swap.connect(taker).fillOrderArgs(order, r, vs, ether('8'), takerTraits.traits, takerTraits.args)
        ).to.be.revertedWithCustomError(multiPhase, "RequestedExceedsUnlocked");
    });

});