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

        const phaseStruct = {
            start,
            end,
            calculator: await twap.getAddress(),
            extraData: twapExtraData
        };

        const extraData = ethers.AbiCoder.defaultAbiCoder().encode([
            "bool", "address", "tuple(uint256 start,uint256 end,address calculator,bytes extraData)[]"
        ], [true, await oracle.getAddress(), [phaseStruct]]);

        const order = buildOrder({
            makerAsset: await dai.getAddress(),
            takerAsset: await weth.getAddress(),
            makingAmount: ether('10'),
            takingAmount: 0,
            maker: maker.address
        }, {
            takingAmountData: extraData,
            makingAmountData: extraData
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

        await swap.connect(taker).fillOrderArgs(order, r, vs, ether('1'), takerTraits.traits, takerTraits.args);

        expect(await dai.balanceOf(maker)).to.equal(makerDaiBefore - ether('10'));
        expect(await dai.balanceOf(taker)).to.equal(takerDaiBefore + ether('10'));
        expect(await weth.balanceOf(maker)).to.be.gt(makerWethBefore); // should have received WETH
        expect(await weth.balanceOf(taker)).to.be.lt(takerWethBefore); // should have paid WETH
    });

    it('reverts outside phase window', async function () {
        const { multiPhase, order, maker, end } = await loadFixture(deployAndBuildOrder);
        await time.increaseTo(end + 100);

        const orderStruct = {
            makerAsset: order.makerAsset,
            takerAsset: order.takerAsset,
            maker: order.maker,
            receiver: order.receiver,
            allowedSender: order.allowedSender,
            makingAmount: order.makingAmount,
            takingAmount: order.takingAmount,
            makerAssetData: order.makerAssetData,
            takerAssetData: order.takerAssetData,
            getMakerAmount: order.getMakerAmount,
            getTakerAmount: order.getTakerAmount,
            predicate: order.predicate,
            permit: order.permit,
            interaction: order.interaction,
            salt: order.salt,
            makerTraits: order.makerTraits ?? 0,
            extension: order.extension ?? '0x'
        };

        await expect(
            multiPhase.getTakingAmount(
                orderStruct,
                '0x',
                ethers.keccak256('0x1234'),
                maker.address,
                ether('1'),
                ether('10'),
                order.takingAmountData
            )
        ).to.be.revertedWith("No active phase");
    });
});