const { expect, time, assertRoughlyEqualValues } = require('@1inch/solidity-utils');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether } = require('./helpers/utils');
const { deploySwapTokens } = require('./helpers/fixtures');
const { buildOrder, signOrder, buildTakerTraits } = require('./helpers/orderUtils');
const { ethers } = require('hardhat');

describe('HybridTWAPDutchCalculator', function () {
    let addr, addr1;

    before(async function () {
        [addr, addr1] = await ethers.getSigners();
    });

    async function deployAndBuildOrder () {
        const { dai, weth, swap, chainId } = await deploySwapTokens();

        await dai.mint(addr, ether('100'));
        await dai.mint(addr1, ether('100'));
        await weth.deposit({ value: ether('10') });
        await weth.connect(addr1).deposit({ value: ether('10') });

        await dai.approve(swap, ether('100'));
        await dai.connect(addr1).approve(swap, ether('100'));
        await weth.approve(swap, ether('10'));
        await weth.connect(addr1).approve(swap, ether('10'));

        const HybridCalculator = await ethers.getContractFactory('HybridTWAPDutchCalculator');
        const calculator = await HybridCalculator.deploy();
        await calculator.waitForDeployment();

        const now = await time.latest();

        const switchTime = now + 600;
        const twapStartPrice = ether('0.08');
        const twapEndPrice = ether('0.1');
        const twapStartTime = now;
        const twapEndTime = now + 600;
        const dutchStartPrice = ether('0.1');
        const dutchEndPrice = ether('0.05');
        const dutchStartTime = now + 600;
        const dutchEndTime = now + 1200;

        const extraData = ethers.AbiCoder.defaultAbiCoder().encode([
            'uint256',
            'uint256', 'uint256', 'uint256', 'uint256',
            'uint256', 'uint256', 'uint256', 'uint256'
        ], [
            switchTime,
            twapStartPrice, twapEndPrice, twapStartTime, twapEndTime,
            dutchStartPrice, dutchEndPrice, dutchStartTime, dutchEndTime
        ]);

        const order = buildOrder(
            {
                makerAsset: await dai.getAddress(),
                takerAsset: await weth.getAddress(),
                makingAmount: ether('100'),
                takingAmount: ether('8'),
                maker: addr.address,
            },
            {
                takingAmountData: ethers.solidityPacked([
                    'address', 'bytes'
                ], [await calculator.getAddress(), extraData]),
                makingAmountData: ethers.solidityPacked([
                    'address', 'bytes'
                ], [await calculator.getAddress(), extraData])
            },
        );

        const signature = await signOrder(order, chainId, await swap.getAddress(), addr);

        const makerDaiBefore = await dai.balanceOf(addr);
        const takerDaiBefore = await dai.balanceOf(addr1);
        const makerWethBefore = await weth.balanceOf(addr);
        const takerWethBefore = await weth.balanceOf(addr1);

        return { dai, weth, swap, order, signature, now, makerDaiBefore, takerDaiBefore, makerWethBefore, takerWethBefore,   calculator,extraData };
    }

    it('fills order before switchTime using TWAP logic', async function () {
        const { dai, weth, swap, order, signature, now, makerDaiBefore, takerDaiBefore, makerWethBefore, takerWethBefore, calculator,extraData } = await loadFixture(deployAndBuildOrder);


        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
            threshold: ether('9.1'),
        });

        await time.increaseTo(now + 300); // halfway through TWAP
        const takingAmount = await calculator.getTakingAmount(order, '0x', ethers.ZeroHash, addr1.address, ether('100'), 0, extraData);
        console.log("Calculated taking amount:", takingAmount.toString());

        await swap.connect(addr1).fillOrderArgs(order, r, vs, ether('100'), takerTraits.traits, takerTraits.args);
        
        expect(await dai.balanceOf(addr)).to.equal(makerDaiBefore - ether('100'));
        expect(await dai.balanceOf(addr1)).to.equal(takerDaiBefore + ether('100'));
        assertRoughlyEqualValues(await weth.balanceOf(addr), makerWethBefore + ether('9'), 5e-3);
        assertRoughlyEqualValues(await weth.balanceOf(addr1), takerWethBefore - ether('9'), 5e-3);
    });

    it('fills order after switchTime using Dutch logic', async function () {
        const { dai, weth, swap, order, signature, now, makerDaiBefore, takerDaiBefore, makerWethBefore, takerWethBefore } = await loadFixture(deployAndBuildOrder);

        await time.increaseTo(now + 900); // halfway through Dutch

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
            threshold: ether('6.5'),
        });

        await swap.connect(addr1).fillOrderArgs(order, r, vs, ether('100'), takerTraits.traits, takerTraits.args);

        expect(await dai.balanceOf(addr)).to.equal(makerDaiBefore - ether('100'));
        expect(await dai.balanceOf(addr1)).to.equal(takerDaiBefore + ether('100'));
        assertRoughlyEqualValues(await weth.balanceOf(addr), makerWethBefore + ether('0.065'), 1e-6);
        assertRoughlyEqualValues(await weth.balanceOf(addr1), takerWethBefore - ether('0.065'), 1e-6);
    });
});
