const hre = require("hardhat");
const { ethers } = hre;
const { parseUnits, getAddress } = require('ethers');

const WETH_HOLDER = getAddress("0x2E40DDCB231672285A5312ad230185ab2F14eD2B");
const USDC_HOLDER = getAddress("0x55fe002aeff02f77364de339a1292923a15844b8");

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

// local
const SWAP_ADDRESS = '0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B';
const DAI_ADDRESS = '0x818eA3862861e82586A4D6E1A78A1a657FC615aa';
const WETH_ADDRESS_LOCAL = '0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B';
const DUTCH_CALCULATOR_ADDRESS = '0xb7aCdc1Ae11554dfe98aA8791DCEE0F009155D5e';

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

async function logTokenBalance(label, tokenContract, address, decimals) {
  const balance = await tokenContract.balanceOf(address);
  console.log(`${label}: ${ethers.formatUnits(balance, decimals)}`);
}

async function main() {
  const [maker, taker] = await ethers.getSigners();

  console.log(`Maker: ${maker.address}`);
  console.log(`Taker: ${taker.address}`);

  // const weth = await ethers.getContractAt(ERC20_ABI, WETH_ADDRESS);
  const weth = await ethers.getContractAt(ERC20_ABI, WETH_ADDRESS_LOCAL);
  const usdc = await ethers.getContractAt(ERC20_ABI, USDC_ADDRESS);
  const dai = await ethers.getContractAt(ERC20_ABI, DAI_ADDRESS);

  console.log("\n🔍 Balances BEFORE funding:");
  // await logTokenBalance("Maker WETH", weth, maker.address, 18);
  // await logTokenBalance("Maker USDC", usdc, maker.address, 6);
  // await logTokenBalance("Taker WETH", weth, taker.address, 18);
  // await logTokenBalance("Taker USDC", usdc, taker.address, 6);

  await logTokenBalance("Maker WETH", weth, maker.address, 18);
  await logTokenBalance("Maker DAI", dai, maker.address, 18);
  await logTokenBalance("Taker WETH", weth, taker.address, 18);
  await logTokenBalance("Taker DAI", dai, taker.address, 18);

  // console.log("\n⚡ Funding accounts...");

  // // Fund Maker with WETH
  // const wethWhale = await ethers.getImpersonatedSigner(WETH_HOLDER);
  // const wethContract = weth.connect(wethWhale);
  // await wethContract.transfer(maker.address, ethers.parseUnits("50", 18));

  // // Fund USDC whale with ETH to cover gas
  // await taker.sendTransaction({ to: USDC_HOLDER, value: ethers.parseEther("0.1") });

  // // Fund Taker with USDC
  // const usdcWhale = await ethers.getImpersonatedSigner(USDC_HOLDER);
  // const usdcContract = usdc.connect(usdcWhale);
  // await usdcContract.transfer(taker.address, ethers.parseUnits("100000", 6));

  // console.log("\n✅ Balances AFTER funding:");
  // await logTokenBalance("Maker WETH", weth, maker.address, 18);
  // await logTokenBalance("Maker USDC", usdc, maker.address, 6);
  // await logTokenBalance("Taker WETH", weth, taker.address, 18);
  // await logTokenBalance("Taker USDC", usdc, taker.address, 6);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
