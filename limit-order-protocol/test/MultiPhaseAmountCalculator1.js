const { expect, time, assertRoughlyEqualValues } = require('@1inch/solidity-utils');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether } = require('./helpers/utils');
const { deploySwapTokens } = require('./helpers/fixtures');
const { buildOrder, signOrder, buildTakerTraits } = require('./helpers/orderUtils');
const { ethers } = require('hardhat');

// ### **Phase 1: 0–8 min (TWAP)**

// - Objective: Minimize market impact by slicing up the order over time.
// - Use case: Ideal when user wants to blend into the market,

// ### **Phase 2: 8–10 min (Dutch Auction)**

// - Objective: Begin discounting the price over time to increase urgency.
// - Use case: Useful if TWAP didn’t fully fill and the user wants more aggressive execution, but still market-driven.

// ### **Phase 3: >10 min (Fixed Price to Whitelist Address)**

// - Objective: If still unfilled, send remaining to known buyer(s) at a pre-negotiated price.
// - Use case: Guarantees the final execution, potentially to a treasury, OTC buyer


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
        const DutchAuctionCalculator = await ethers.getContractFactory('DutchAuctionCalculator');
        const dutchAuctionCalculator = await DutchAuctionCalculator.deploy();
        await dutchAuctionCalculator.waitForDeployment();


        const PrenegotiatedCalculator = await ethers.getContractFactory('PrenegotiatedCalculator');
        const prenegotiatedCalculator = await PrenegotiatedCalculator.deploy();
        await prenegotiatedCalculator.waitForDeployment();


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

        const twapStart = now + 60;
        const twapEnd = twapStart + 20 * 60;  // 20 minutes
        const dutchEnd = twapEnd + 10 * 60;   // 10 minutes after TWAP
        const preEnd = dutchEnd + 10 * 60;   // 10 minutes after TWAP

        // Using chunkAmount-based TWAP
        const chunkAmount = ether('500');
        const interval = 60; // seconds

        const twapExtraData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "uint256", "uint256", "address", "uint8", "uint8"],
            [twapStart, interval, chunkAmount, await daiOracle.getAddress(), 18, 18]
        );

        const startEndTs = (BigInt(twapEnd) << 128n) | BigInt(dutchEnd);

        const takingAmountStart = ether('3'); // 10,000 DAI * 0.0003 WETH/DAI
        const takingAmountEnd   = ether('2'); // 10,000 DAI * 0.0002 WETH/DAI
        const dutchExtraData = ethers.solidityPacked(
            ['uint256', 'uint256', 'uint256'],
            [startEndTs, takingAmountStart, takingAmountEnd]
        );

        const fixedPrice = ethers.parseUnits("1.25", 18); // 1.25 USDC per WETH
        const allowedTakers = [taker.address]; // Only addr1 is allowed
        const makerDecimals = 18; // WETH
        const takerDecimals = 18;  // DAI mimicking USDC (6 decimals)

        const prenegotiatedExtraData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "address[]", "uint8", "uint8"],
            [fixedPrice, allowedTakers, makerDecimals, takerDecimals]
        );

        const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["bool", "address", "tuple(uint256,uint256,address,bytes)[]"],
            [
                true, // oracleRequired
                await daiOracle.getAddress(),
                [
                    [twapStart, twapEnd, await twap.getAddress(), twapExtraData],
                    [twapEnd, dutchEnd, await dutchAuctionCalculator.getAddress(), dutchExtraData]
                    [dutchEnd, preEnd, await prenegotiatedCalculator.getAddress(), prenegotiatedExtraData]

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
            dai, weth, swap, multiPhase, order, signature, daiOracle, twapStart, twapEnd,dutchEnd,
            makerDaiBefore, takerDaiBefore, makerWethBefore, takerWethBefore
        };
    }

    it('reverts if fill exceeds unlocked (chunk-based TWAP)', async function () {
        const {
            dai, weth, swap, multiPhase, order, signature,  twapStart, twapEnd,dutchEnd
        } = await loadFixture(deployAndBuildOrder);

        await time.increaseTo(twapStart + 120); // 2 intervals = 2 chunks = 1000 DAI

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
            dai, weth, swap, multiPhase, order, signature,  twapStart, twapEnd,dutchEnd, makerDaiBefore,takerDaiBefore,makerWethBefore,takerWethBefore
        } = await loadFixture(deployAndBuildOrder);

        await time.increaseTo(twapStart + 120); // 2 intervals = 2 chunks = 1000 DAI

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
            threshold: ether('0.226') // buffer for rounding
        });
        const fillAmount = ether('900');
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
    it('uses DutchAuctionCalculator after TWAP phase ends (correct takingAmount logic)', async function () {
        const {
            dai, weth, swap, multiPhase, order, signature,
            twapStart, twapEnd, dutchEnd,
            makerDaiBefore, takerDaiBefore, makerWethBefore, takerWethBefore
        } = await loadFixture(deployAndBuildOrder);

        await time.increaseTo(twapStart + 25 * 60); // 20min TWAP + 5min Dutch = 25min

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        const fillAmount = ether('10000'); // taker wants 1,000 DAI

        const startWeth = ether('3');  // for 10,000 DAI = 0.0003 per DAI
        const endWeth = ether('2');    // for 10,000 DAI = 0.0002 per DAI

        const totalDuration = BigInt(dutchEnd - twapEnd); // 600 seconds
        const elapsed = BigInt(5 * 60);                   // 5 minutes = 300 seconds

        // linear interpolation:
        // totalWeth = start * (endTime - current) + end * (current - start) / duration
        const totalWethNow = (
            startWeth * (totalDuration - elapsed) +
            endWeth * elapsed
        ) / totalDuration;

        const expectedWethOut = totalWethNow * fillAmount / ether('10000');

        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
            threshold: expectedWethOut + ether('0.00005'), // slippage buffer
        });

        const tx = await swap.connect(taker).fillOrderArgs(order, r, vs, fillAmount, takerTraits.traits, takerTraits.args);
        await tx.wait();

        const makerWeth = await weth.balanceOf(order.maker);
        const deltaWeth = makerWeth - makerWethBefore;

        expect(deltaWeth).to.be.closeTo(expectedWethOut, ether('0.005'));
    });



});
