const hre = require('hardhat');
const { ethers } = hre;


async function main() {

  console.log("🚀 Deploying contracts...\n");
  const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // Mainnet WETH

    const LimitOrderProtocol = await ethers.getContractFactory("LimitOrderProtocol");
    const swap = await LimitOrderProtocol.deploy(WETH_ADDRESS);

    await swap.waitForDeployment();
  const swapAddress = await swap.getAddress();
  console.log(`✅ LimitOrderProtocol deployed at ${swapAddress}`);

  const MockOracle = await ethers.getContractFactory('MockV3Aggregator');
  const oracle = await MockOracle.deploy(8, ethers.parseUnits("3000", 8));
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log(`✅ Oracle deployed at ${oracleAddress}`);

  const MultiPhaseFactory = await ethers.getContractFactory("MultiPhaseAmountCalculator");
  const multiPhase = await MultiPhaseFactory.deploy();
  await multiPhase.waitForDeployment();
  const multiPhaseAddress = await multiPhase.getAddress();

  console.log(`✅ MultiPhaseAmountCalculator deployed at ${multiPhaseAddress}`);

  const TWAPFactory = await ethers.getContractFactory("TWAPCalculator");
  const twap = await TWAPFactory.deploy();
  await twap.waitForDeployment();
  const twapAddress = await twap.getAddress();
  console.log(`✅ TWAPCalculator deployed at ${twapAddress}`);

  const DutchFactory = await ethers.getContractFactory("DutchAuctionCalculator");
  const dutch = await DutchFactory.deploy();
  await dutch.waitForDeployment();
  const dutchAddress = await dutch.getAddress();
  console.log(`✅ DutchAuctionCalculator deployed at ${dutchAddress}`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
