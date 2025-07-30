const { ethers } = require("hardhat");

const { buildOrder, signOrder, buildTakerTraits } = require('../../limit-order-protocol/test/helpers/orderUtils');

const LOP_ADDRESS = "0x111111125421ca6dc452d289314280a0f8842a65"; // 1inch Limit Order Protocol

const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eb48";

async function main() {
  let maker, taker;
  [maker, taker] = await ethers.getSigners();
  console.log("Maker:", maker.address);
  console.log("Taker:", taker.address);

  const chainId = (await ethers.provider.getNetwork()).chainId;

  // fund 

}

// Utility to impersonate and fund any address on fork
async function impersonateAndFund(address) {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });

  const funder = (await ethers.getSigners())[0];
  await funder.sendTransaction({
    to: address,
    value: ethers.utils.parseEther("1"),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
