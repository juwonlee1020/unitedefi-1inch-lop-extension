const { expect, time, assertRoughlyEqualValues } = require('@1inch/solidity-utils');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether } = require('./helpers/utils');
const { deploySwapTokens } = require('./helpers/fixtures');
const { buildOrder, signOrder, buildTakerTraits } = require('./helpers/orderUtils');
const { ethers } = require('hardhat');

describe('MultiPhaseAmountCalculator (integration, chunk-based TWAP)', function () {
    let maker, taker;

    before(async function () {
        [maker, taker] = await ethers.getSigners();
    });

    async function deployAndBuildOrder () {
        const { dai, weth, swap, chainId } = await deploySwapTokens();

        await dai.mint(maker, ether('10000'));
        await dai.mint(taker, ether('10000'));
        await weth.deposit({ value: ether('10') });
        await weth.connect(taker).deposit({ value: ether('10') });

        await dai.approve(swap, ether('10000'));
        await dai.connect(taker).approve(swap, ether('10000'));
        await weth.approve(swap, ether('10'));
        await weth.connect(taker).approve(swap, ether('10'));

        const TWAPCalculator = await ethers.getContractFactory('TWAPCalculator');
        const twap = await TWAPCalculator.deploy();
        await twap.waitForDeployment();


        // deploy dutch auction calculator


        const MultiPhase = await ethers.getContractFactory('MultiPhaseAmountCalculator');
        const multiPhase = await MultiPhase.deploy();
        await multiPhase.waitForDeployment();

        const MockOracle = await ethers.getContractFactory('MockV3Aggregator');
        const daiOracle = await MockOracle.deploy(8, ethers.parseUnits("0.00025", 8));


        // const AggregatorMock = await ethers.getContractFactory('AggregatorMock');
        // const daiOracle = await AggregatorMock.deploy(ether('0.00025'));
        await daiOracle.waitForDeployment();


        
        // await daiOracle.waitForDeployment();

        const now = await time.latest();
        const start = now + 60;
        const end = now + 600;

        // Using chunkAmount-based TWAP
        const chunkAmount = ether('1000');
        const interval = 60; // seconds

        const twapExtraData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "uint256", "uint256", "address", "uint8", "uint8"],
            [start, interval, chunkAmount, await daiOracle.getAddress(), 18, 18]
        );

        const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["bool", "address", "tuple(uint256,uint256,address,bytes)[]"],
            [
                true, // oracleRequired
                await daiOracle.getAddress(),
                [
                    [start, end, await twap.getAddress(), twapExtraData]
                ]
            ]
        );

        const makingAmountData = ethers.solidityPacked(['address', 'bytes'], [await multiPhase.getAddress(), extraData]);
        const takingAmountData = ethers.solidityPacked(['address', 'bytes'], [await multiPhase.getAddress(), extraData]);

        const order = buildOrder({
            makerAsset: await dai.getAddress(),
            takerAsset: await weth.getAddress(),
            makingAmount: ether('10000'),
            takingAmount: 0,
            maker: maker.address
        }, {
            makingAmountData,
            takingAmountData
        });

        const signature = await signOrder(order, chainId, await swap.getAddress(), maker);

        const makerDaiBefore = await dai.balanceOf(maker);
        const takerDaiBefore = await dai.balanceOf(taker);
        const makerWethBefore = await weth.balanceOf(maker);
        const takerWethBefore = await weth.balanceOf(taker);

        return {
            dai, weth, swap, multiPhase, order, signature, daiOracle, start, end,
            makerDaiBefore, takerDaiBefore, makerWethBefore, takerWethBefore
        };
    }

    it('reverts if fill exceeds unlocked (chunk-based TWAP)', async function () {
        const {
            dai, weth, swap, multiPhase, order, signature, start,
        } = await loadFixture(deployAndBuildOrder);

        await time.increaseTo(start + 120); // 2 intervals = 2 chunks = 2000 DAI

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
        });

        // Trying to fill 3000 DAI should revert
        await expect(
            swap.connect(taker).fillOrderArgs(order, r, vs, ether('3000'), takerTraits.traits, takerTraits.args)
        ).to.be.revertedWithCustomError(multiPhase, "RequestedExceedsUnlocked");
    });

    it('allows fill within unlocked chunk limit and updates balances correctly', async function () {
        const {
            dai, weth, swap, multiPhase, order, signature, start, makerDaiBefore,takerDaiBefore,makerWethBefore,takerWethBefore
        } = await loadFixture(deployAndBuildOrder);

        await time.increaseTo(start + 120); // 2 intervals = 2 chunks = 2000 DAI

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
            threshold: ether('0.476') // buffer for rounding
        });
        const fillAmount = ether('1900');
        await swap.connect(taker).fillOrderArgs(order, r, vs, fillAmount, takerTraits.traits, takerTraits.args);

        // Check DAI balances
        expect(await dai.balanceOf(maker.address)).to.equal(makerDaiBefore - fillAmount);
        expect(await dai.balanceOf(taker.address)).to.equal(takerDaiBefore + fillAmount);

        // Check WETH balances (based on mock price of 0.00025 WETH per 1 DAI)
        const wethOut = fillAmount * BigInt(25) / BigInt(100000); // = fillAmount * 0.00025
        const makerExpectedWeth = makerWethBefore + wethOut;
        const takerExpectedWeth = takerWethBefore - wethOut;

        assertRoughlyEqualValues(await weth.balanceOf(maker.address), makerExpectedWeth, 1);
        assertRoughlyEqualValues(await weth.balanceOf(taker.address), takerExpectedWeth, 1);
    });
});
