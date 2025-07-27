const { expect, time, assertRoughlyEqualValues } = require('@1inch/solidity-utils');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { buildOrder, signOrder, buildTakerTraits } = require('./helpers/orderUtils');
const { deploySwapTokens } = require('./helpers/fixtures');
const { ether } = require('./helpers/utils');
const { ethers } = require('hardhat');

describe('TWAPCalculator with decimals', function () {
    let maker, taker;

    before(async () => {
        [maker, taker] = await ethers.getSigners();
    });

    async function deployAndBuildOrder () {
        const { weth, usdc, swap, chainId } = await deploySwapTokens();

        // Mint + deposit/approve WETH + USDC
        await weth.deposit({ value: ether('10') });
        await weth.connect(taker).deposit({ value: ether('10') });

        await weth.approve(swap, ether('10'));
        await weth.connect(taker).approve(swap, ether('10'));

        await usdc.mint(maker.address, ether('32000'));
        await usdc.mint(taker.address, ether('32000'));
        await usdc.approve(swap, ether('32000'));
        await usdc.connect(taker).approve(swap, ether('32000'));

        // Deploy TWAPCalculator
        const TWAPCalculator = await ethers.getContractFactory('TWAPCalculator');
        const calculator = await TWAPCalculator.deploy();
        await calculator.waitForDeployment();

        // Deploy mock Chainlink price feed: 3200 USD per ETH (8 decimals)
        const MockV3Aggregator = await ethers.getContractFactory('MockV3Aggregator');
        const mockFeed = await MockV3Aggregator.deploy(8, BigInt(3200e8));
        await mockFeed.waitForDeployment();

        const chunkAmount = ether('1');
        const totalAmount = ether('10');
        const interval = 300;
        const now = await time.latest();
        const startTime = now + 60;

        // Prepare extraData
        const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
            ['uint256', 'uint256', 'uint256', 'uint256', 'address', 'uint8', 'uint8'],
            [startTime, interval, chunkAmount, totalAmount, await mockFeed.getAddress(), 18, 6] // WETH → USDC
        );

        const calculatorAddr = await calculator.getAddress();

        const makingAmountData = ethers.solidityPacked(
            ['address', 'bytes'],
            [calculatorAddr, extraData]
        );
        const takingAmountData = ethers.solidityPacked(
            ['address', 'bytes'],
            [calculatorAddr, extraData]
        );

        const order = buildOrder(
            {
                makerAsset: await weth.getAddress(),
                takerAsset: await usdc.getAddress(),
                makingAmount: totalAmount,
                takingAmount: 0,
                maker: maker.address,
                receiver: maker.address,
            },
            {
                makingAmountData,
                takingAmountData,
            }
        );

        const signature = await signOrder(order, chainId, await swap.getAddress(), maker);

        return {
            weth, usdc, swap, calculator, order, signature, startTime, chunkAmount,
            makerWeth: await weth.balanceOf(maker.address),
            takerWeth: await weth.balanceOf(taker.address),
            makerUsdc: await usdc.balanceOf(maker.address),
            takerUsdc: await usdc.balanceOf(taker.address),
        };
    }

    it('fills 1 WETH chunk correctly after 1 interval', async function () {
        const {
            weth, usdc, swap, order, signature, startTime, chunkAmount,
            makerWeth, takerWeth, makerUsdc, takerUsdc
        } = await loadFixture(deployAndBuildOrder);

        await time.increaseTo(startTime + 300);

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
            threshold: ethers.parseUnits('3200', 6), // USDC threshold
        });

        await swap.connect(taker).fillOrderArgs(
            order,
            r,
            vs,
            chunkAmount,
            takerTraits.traits,
            takerTraits.args
        );

        // Check WETH balances
        expect(await weth.balanceOf(maker.address)).to.equal(makerWeth - chunkAmount);
        expect(await weth.balanceOf(taker.address)).to.equal(takerWeth + chunkAmount);

        // Check USDC balances (taker pays 3200 USDC for 1 WETH)
        assertRoughlyEqualValues(await usdc.balanceOf(maker.address), makerUsdc + ethers.parseUnits("3200", 6), 1);
        assertRoughlyEqualValues(await usdc.balanceOf(taker.address), takerUsdc - ethers.parseUnits("3200", 6), 1);
    });

    it('reverts if fill attempted before startTime', async function () {
        const { swap, order, signature, chunkAmount, calculator } = await loadFixture(deployAndBuildOrder);

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
            threshold: ethers.parseUnits("3300", 6),
        });

        await expect(
            swap.connect(taker).fillOrderArgs(order, r, vs, chunkAmount, takerTraits.traits, takerTraits.args)
        ).to.be.revertedWithCustomError(calculator, "RequestedExceedsUnlocked");
    });

    it('reverts if taker fills more than unlocked chunk after 1 interval', async function () {
        const {
            swap, order, calculator, signature, startTime, chunkAmount
        } = await loadFixture(deployAndBuildOrder);

        await time.increaseTo(startTime + 300); // 1 interval passed

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
            threshold: ethers.parseUnits("6600", 6), // for 2 chunks
        });

        await expect(
            swap.connect(taker).fillOrderArgs(
                order,
                r,
                vs,
                chunkAmount * 2n,
                takerTraits.traits,
                takerTraits.args
            )
        ).to.be.revertedWithCustomError(calculator, "RequestedExceedsUnlocked");
    });

});
