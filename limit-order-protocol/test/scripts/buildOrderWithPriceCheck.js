const hre = require('hardhat');
const { ethers } = hre;
const { time } = require('@1inch/solidity-utils');
const { parseUnits, Contract, formatUnits } = require('ethers');

// ---- CONFIG ---- //
const CHAINLINK_ETH_USD = "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"; // mainnet ETH/USD
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ETH_WHALE = "0x2E40DDCB231672285A5312ad230185ab2F14eD2B"; // funded WETH whale
const ONEINCH_ROUTER = "0x111111125421ca6dc452d289314280a0f8842a65";

// --- MAIN SCRIPT --- //
async function main() {
  const [signer] = await ethers.getSigners();

  console.log(`Signer: ${signer.address}`);

  // --- Impersonate and fund ETH ---
  await ethers.provider.send("hardhat_impersonateAccount", [ETH_WHALE]);
  const whale = await ethers.getSigner(ETH_WHALE);
  await signer.sendTransaction({ to: whale.address, value: parseUnits("1", "ether") });

  // --- Check Chainlink Price (ETH/USD) ---
  const chainlink = new Contract(CHAINLINK_ETH_USD, [
    "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)"
  ], signer);

  const [_, price1] = await chainlink.latestRoundData();
  console.log(`🔹 Initial ETH/USD price: $${formatUnits(price1, 8)}`);

  // --- Deploy MultiPhaseAmountCalculator ---
  const MultiPhase = await ethers.getContractFactory("MultiPhaseAmountCalculator");
  const calculator = await MultiPhase.deploy();
  await calculator.waitForDeployment();
  console.log(`✅ MultiPhaseAmountCalculator deployed at ${await calculator.getAddress()}`);

  // --- Build extraData ---
  const now = await time.latest();
  const startTime = now;
  const twapInterval = 60; // seconds
  const chunkSize = parseUnits("0.1", 18); // 0.1 ETH
  const totalAmount = parseUnits("1", 18); // 1 ETH
  const transitionDelay = 3000; // 50 minutes
  const dutchDuration = 600; // 10 minutes

  const makerDecimals = 18;
  const takerDecimals = 6;

  const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "uint256", "uint256", "uint256", "uint256",
      "uint256", "uint256",
      "address", "uint8", "uint8"
    ],
    [
      startTime,
      twapInterval,
      chunkSize,
      totalAmount,
      transitionDelay,
      dutchDuration,
      CHAINLINK_ETH_USD,
      makerDecimals,
      takerDecimals
    ]
  );

  console.log("🛠  Encoded `extraData` for MultiPhaseAmountCalculator.");

  // --- Advance time by 5 minutes (300s) ---
  await time.increase(1000);
  const [__, price2] = await chainlink.latestRoundData();
  console.log(`⏩ ETH/USD price after 5min: $${formatUnits(price2, 8)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});