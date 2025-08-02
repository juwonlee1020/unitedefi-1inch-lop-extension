const { expect, time, assertRoughlyEqualValues } = require('@1inch/solidity-utils');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { buildOrder, signOrder, buildTakerTraits } = require('./helpers/orderUtils');
const { deploySwapTokens } = require('./helpers/fixtures');
const { ether } = require('./helpers/utils');
const { ethers } = require('hardhat');

describe('TWAPCalculator (Chunk-Based)', function () {
    let maker, taker;

    before(async () => {
        [maker, taker] = await ethers.getSigners();
    });

    async function deployChunkBasedFixture () {
        const { weth, usdc, swap, chainId } = await deploySwapTokens();

        // Token prep
        await weth.deposit({ value: ether('10') });
        await weth.connect(taker).deposit({ value: ether('10') });
        await weth.approve(swap, ether('10'));
        await weth.connect(taker).approve(swap, ether('10'));

        await usdc.mint(taker.address, ether('50000'));
        await usdc.connect(taker).approve(swap, ether('50000'));

        // Deploy TWAPCalculator
        const TWAPCalculator = await ethers.getContractFactory('TWAPCalculator');
        const calculator = await TWAPCalculator.deploy();
        await calculator.waitForDeployment();

        // Deploy mock Chainlink price feed (ETH/USD = 3200)
        const MockV3Aggregator = await ethers.getContractFactory('MockV3Aggregator');
        const mockFeed = await MockV3Aggregator.deploy(8, BigInt(3200e8));
        await mockFeed.waitForDeployment();

        const chunkAmount = ether('1');
        const interval = 60;
        const now = await time.latest();
        const startTime = now + 30;

        const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
            ['uint256', 'uint256', 'uint256', 'address', 'uint8', 'uint8'],
            [startTime, interval, chunkAmount, await mockFeed.getAddress(), 18, 6]
        );

        const calculatorAddr = await calculator.getAddress();
        const makingAmountData = ethers.solidityPacked(['address', 'bytes'], [calculatorAddr, extraData]);
        const takingAmountData = ethers.solidityPacked(['address', 'bytes'], [calculatorAddr, extraData]);

        const order = buildOrder({
            makerAsset: await weth.getAddress(),
            takerAsset: await usdc.getAddress(),
            makingAmount: ether('10'),
            takingAmount: 0,
            maker: maker.address,
            receiver: maker.address,
        }, {
            makingAmountData,
            takingAmountData
        });

        const signature = await signOrder(order, chainId, await swap.getAddress(), maker);

        return {
            weth, usdc, swap, calculator, order, signature, startTime, interval, chunkAmount, maker, taker
        };
    }

    it('fills 1 chunk after 1 interval', async function () {
        const {
            weth, usdc, swap, order, signature, startTime, interval, chunkAmount, taker, maker
        } = await loadFixture(deployChunkBasedFixture);

        const makerWethBefore = await weth.balanceOf(maker.address);
        const takerWethBefore = await weth.balanceOf(taker.address);
        const makerUsdcBefore = await usdc.balanceOf(maker.address);
        const takerUsdcBefore = await usdc.balanceOf(taker.address);

        await time.increaseTo(startTime + interval);

        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
            threshold: ethers.parseUnits("3300", 6)
        });

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        await swap.connect(taker).fillOrderArgs(order, r, vs, chunkAmount, takerTraits.traits, takerTraits.args);

        // Maker lost 1 WETH, received 3200 USDC
        expect(await weth.balanceOf(maker.address)).to.equal(makerWethBefore - chunkAmount);
        assertRoughlyEqualValues(await usdc.balanceOf(maker.address), makerUsdcBefore + ethers.parseUnits("3200", 6), 1);

        // Taker received 1 WETH, paid 3200 USDC
        expect(await weth.balanceOf(taker.address)).to.equal(takerWethBefore + chunkAmount);
        assertRoughlyEqualValues(await usdc.balanceOf(taker.address), takerUsdcBefore - ethers.parseUnits("3200", 6), 1);
    });

    it('reverts if fill attempted before startTime', async function () {
        const {
            swap, order, signature, chunkAmount, calculator, taker
        } = await loadFixture(deployChunkBasedFixture);

        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
            threshold: ethers.parseUnits("3300", 6)
        });

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);

        await expect(
            swap.connect(taker).fillOrderArgs(order, r, vs, chunkAmount, takerTraits.traits, takerTraits.args)
        ).to.be.revertedWithCustomError(calculator, "RequestedExceedsUnlocked");
    });

    it('reverts if taker fills more than unlocked after 1 interval', async function () {
        const {
            swap, order, signature, startTime, interval, chunkAmount, calculator, taker
        } = await loadFixture(deployChunkBasedFixture);

        await time.increaseTo(startTime + interval); // 1 chunk unlocked

        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
            threshold: ethers.parseUnits("6600", 6) // for 2 chunks
        });

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);

        await expect(
            swap.connect(taker).fillOrderArgs(order, r, vs, chunkAmount * 2n, takerTraits.traits, takerTraits.args)
        ).to.be.revertedWithCustomError(calculator, "RequestedExceedsUnlocked");
    });
});
