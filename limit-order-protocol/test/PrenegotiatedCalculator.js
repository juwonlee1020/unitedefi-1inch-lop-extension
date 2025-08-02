const { expect, assertRoughlyEqualValues } = require('@1inch/solidity-utils');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether } = require('./helpers/utils');
const { deploySwapTokens } = require('./helpers/fixtures');
const { buildOrder, signOrder, buildTakerTraits } = require('./helpers/orderUtils');
const { ethers } = require('hardhat');

describe('PrenegotiatedCalculator', function () {
    let addr, addr1, addr2;

    before(async function () {
        [addr, addr1, addr2] = await ethers.getSigners(); // addr1 is allowed, addr2 is not
    });

    async function deployAndBuildOrder() {
        const { dai, weth, swap, chainId } = await deploySwapTokens();

        await dai.mint(addr, ether('100'));
        await dai.mint(addr1, ether('100'));
        await dai.mint(addr2, ether('100'));
        await weth.deposit({ value: ether('1') });
        await weth.connect(addr1).deposit({ value: ether('1') });
        await weth.connect(addr2).deposit({ value: ether('1') });

        await dai.approve(swap, ether('100'));
        await dai.connect(addr1).approve(swap, ether('100'));
        await dai.connect(addr2).approve(swap, ether('100'));
        await weth.approve(swap, ether('1'));
        await weth.connect(addr1).approve(swap, ether('1'));
        await weth.connect(addr2).approve(swap, ether('1'));

        const PrenegotiatedCalculator = await ethers.getContractFactory('PrenegotiatedCalculator');
        const calculator = await PrenegotiatedCalculator.deploy();
        await calculator.waitForDeployment();

        const fixedPrice = ethers.parseUnits("1.25", 18); // 1.25 USDC per WETH
        const allowedTakers = [addr1.address]; // Only addr1 is allowed
        const makerDecimals = 18; // WETH
        const takerDecimals = 6;  // DAI mimicking USDC (6 decimals)

        const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "address[]", "uint8", "uint8"],
            [fixedPrice, allowedTakers, makerDecimals, takerDecimals]
        );

        const order = buildOrder(
            {
                makerAsset: await weth.getAddress(),
                takerAsset: await dai.getAddress(),
                makingAmount: ether('1'),     // WETH
                takingAmount: 125000000,      // 1.25 * 1e8 (DAI 6 decimals)
                maker: addr.address,
            },
            {
                makingAmountData: ethers.solidityPacked(['address', 'bytes'], [await calculator.getAddress(), extraData]),
                takingAmountData: ethers.solidityPacked(['address', 'bytes'], [await calculator.getAddress(), extraData]),
            }
        );

        const signature = await signOrder(order, chainId, await swap.getAddress(), addr);

        return { dai, weth, swap, order, signature, calculator, maker: addr, takerAllowed: addr1, takerBlocked: addr2 };
    }

    it("allows whitelisted taker to fill the order", async function () {
        const { dai, weth, swap, order, signature, takerAllowed } = await loadFixture(deployAndBuildOrder);

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        const takerTraits = buildTakerTraits({ extension: order.extension });

        const makerWethBefore = await weth.balanceOf(order.maker);
        const takerWethBefore = await weth.balanceOf(takerAllowed);
        const makerDaiBefore = await dai.balanceOf(order.maker);
        const takerDaiBefore = await dai.balanceOf(takerAllowed);

        await swap.connect(takerAllowed).fillOrderArgs(order, r, vs, 125000000, takerTraits.traits, takerTraits.args);

        assertRoughlyEqualValues(await weth.balanceOf(order.maker), makerWethBefore - ether('1'), 1e-6);
        assertRoughlyEqualValues(await weth.balanceOf(takerAllowed), takerWethBefore + ether('1'), 1e-6);
        expect(await dai.balanceOf(order.maker)).to.equal(makerDaiBefore + 125000000n);
        expect(await dai.balanceOf(takerAllowed)).to.equal(takerDaiBefore - 125000000n);
    });

    it("rejects non-whitelisted taker", async function () {
        const { dai, weth, swap, order,calculator, signature, takerBlocked } = await loadFixture(deployAndBuildOrder);

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        const takerTraits = buildTakerTraits({ extension: order.extension });

        await expect(
            swap.connect(takerBlocked).fillOrderArgs(order, r, vs, 125000000, takerTraits.traits, takerTraits.args)
        ).to.be.revertedWithCustomError(calculator, "NotAllowedTaker");
    });
});
