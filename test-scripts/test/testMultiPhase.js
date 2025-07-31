const { ethers } = require("hardhat");
const { parseUnits, getAddress } = require('ethers');
const { buildOrder, signOrder, buildTakerTraits } = require('../../limit-order-protocol/test/helpers/orderUtils');
const fs = require("fs");
const path = require("path");
const { expect, time } = require('@1inch/solidity-utils');

const LOP_ADDRESS = getAddress("0x119c71D3BbAC22029622cbaEc24854d3D32D2828"); // 1inch Limit Order Protocol
const DUTCH_AUCTION_CALCULATOR_ADDRESS = getAddress("0xaA19aff541ed6eBF528f919592576baB138370DC");
const WETH_ADDRESS =getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"); // lowercase
const USDC_ADDRESS = getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eb48");

// ✅ Oracle deployed at 0x14835B093D320AA5c9806BBC64C17F0F2546D9EE
// ✅ MultiPhaseAmountCalculator deployed at 0x818eA3862861e82586A4D6E1A78A1a657FC615aa
// ✅ TWAPCalculator deployed at 0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B
// ✅ DutchAuctionCalculator deployed at 0xaA19aff541ed6eBF528f919592576baB138370DC

async function getLimitOrderProtocol(signer) {
    const limitOrderProtocolJson = JSON.parse(
          fs.readFileSync(path.join(__dirname, "../abi/LimitOrderProtocol.json"), "utf8")
    );
    const limitOrderProtocolAbi = limitOrderProtocolJson.abi;
    console.log(limitOrderProtocolAbi);
    const contract = new ethers.Contract(LOP_ADDRESS, limitOrderProtocolAbi, signer);
    return contract;
}

async function main() {
    let maker, taker;
    [maker, taker] = await ethers.getSigners();
    console.log("Maker:", maker.address);
    console.log("Taker:", taker.address);

    const swap = await getLimitOrderProtocol(maker);
    const domain = await swap.DOMAIN_SEPARATOR();
    console.log("Domain separator:", domain);

    const chainId = (await ethers.provider.getNetwork()).chainId;

    const ts = BigInt(await time.latest());
    const startEndTs = (ts << 128n) | (ts + 86400n);
    const order = buildOrder(
        {
            makerAsset: WETH_ADDRESS,
            takerAsset: USDC_ADDRESS,
            makingAmount: parseUnits('100'),
            takingAmount: 0,
            maker: maker.address,
        },
        {
            makingAmountData: ethers.solidityPacked(
                ['address', 'uint256', 'uint256', 'uint256'],
                [DUTCH_AUCTION_CALCULATOR_ADDRESS, startEndTs.toString(), parseUnits('0.1'), parseUnits('0.05')],
            ),
            takingAmountData: ethers.solidityPacked(
                ['address', 'uint256', 'uint256', 'uint256'],
                [DUTCH_AUCTION_CALCULATOR_ADDRESS, startEndTs.toString(), parseUnits('0.1'), parseUnits('0.05')],
            ),
        },
    );
    const signature = await signOrder(order, chainId, LOP_ADDRESS, maker);
    console.log(signature)
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
