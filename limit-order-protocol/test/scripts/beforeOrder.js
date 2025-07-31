const { expect, time, assertRoughlyEqualValues } = require('@1inch/solidity-utils');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether } = require('../helpers/utils');
const { deploySwapTokens } = require('../helpers/fixtures');
const { buildOrder, signOrder, buildTakerTraits } = require('../helpers/orderUtils');
const { ethers } = require('hardhat');


const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

async function logTokenBalance(label, tokenContract, address, decimals) {
  const balance = await tokenContract.balanceOf(address);
  console.log(`${label}: ${ethers.formatUnits(balance, decimals)}`);
}

async function main() {
    const [addr, addr1] = await ethers.getSigners();

    console.log(`Maker: ${addr.address}`);
    console.log(`Taker: ${addr1.address}`);

    const { dai, weth, swap, chainId } = await deploySwapTokens();
    // need token addresses 
    // need to check how much token each account has
    // need to check how much token each 
    console.log("SWAP Address", await swap.getAddress());
    console.log("DAI Address", await dai.getAddress());
    console.log("WETH Address", await weth.getAddress());

    await dai.mint(addr, ether('100'));
    await dai.mint(addr1, ether('100'));
    await weth.deposit({ value: ether('1') });
    await weth.connect(addr1).deposit({ value: ether('1') });

    await dai.approve(swap, ether('100'));
    await dai.connect(addr1).approve(swap, ether('100'));
    await weth.approve(swap, ether('1'));
    await weth.connect(addr1).approve(swap, ether('1'));

    const DutchAuctionCalculator = await ethers.getContractFactory('DutchAuctionCalculator');
    const dutchAuctionCalculator = await DutchAuctionCalculator.deploy();
    await dutchAuctionCalculator.waitForDeployment();
    console.log("Dutch Auction Calculator Address", await dutchAuctionCalculator.getAddress());



}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
