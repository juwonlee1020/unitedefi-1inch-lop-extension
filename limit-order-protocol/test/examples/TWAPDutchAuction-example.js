const hre = require('hardhat');
const { ethers } = hre;
const { buildOrder, signOrder, buildTakerTraits } = require('../helpers/orderUtils');
const { expect, time } = require('@1inch/solidity-utils');
const { ether } = require('../helpers/utils');
const limitOrderAbi = require("../abi/lop.json"); // Adjust path if needed



// From mainnet fork
const WETH_HOLDER = '0x2E40DDCB231672285A5312ad230185ab2F14eD2B';
const USDC_HOLDER = "0x55fe002aeff02f77364de339a1292923a15844b8"; // Circle's USDC reserve
const ONEINCH_V6_ADDRESS = '0x111111125421ca6dc452d289314280a0f8842a65';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";


// Deployed contracts
// ✅ LimitOrderProtocol deployed at 0x818eA3862861e82586A4D6E1A78A1a657FC615aa
// ✅ Oracle deployed at 0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B
// ✅ MultiPhaseAmountCalculator deployed at 0xaA19aff541ed6eBF528f919592576baB138370DC
// ✅ TWAPCalculator deployed at 0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B
// ✅ DutchAuctionCalculator deployed at 0xEAD683c29178d41A511311c1Eb0fce8aD618c3CF
const LOP_ADDRESS = "0x818eA3862861e82586A4D6E1A78A1a657FC615aa";
const MULTIPHASE_CALCULATOR_ADDRESS = "0xaA19aff541ed6eBF528f919592576baB138370DC";
const TWAP_CALCULATOR_ADDRESS = "0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B";
const PRICE_ORACLE_ADDRESS = "0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B";
const DUTCH_AUCTION_CALCULATOR_ADDRESS = "0xEAD683c29178d41A511311c1Eb0fce8aD618c3CF"



// Method signature representation of ABI for ERC20 contracts - https://docs.ethers.org/v6/getting-started/#starting-contracts
const erc20Abi = [
    "function balanceOf(address) view returns (uint)",
    "function transfer(address to, uint256 value) returns (bool)",
    "function approve(address spender, uint256 value) returns (bool)"
]

async function transferTokenFromWhale({
    recipient,
    holder,
    tokenName,
    tokenAddress,
    amount = "10",
    tokenDecimal=18
}) {
    const impersonatedSigner = await ethers.getImpersonatedSigner(holder);

    const ethBalance = await ethers.provider.getBalance(impersonatedSigner.address);
    console.log(`ETH Balance of whale (${impersonatedSigner.address}): ${ethers.formatEther(ethBalance)} ETH`);

    const tokenContract = await ethers.getContractAt(erc20Abi, tokenAddress, impersonatedSigner);

    let tokenBalance = await tokenContract.balanceOf(impersonatedSigner.address);
    console.log(`${tokenName} Balance of whale (${impersonatedSigner.address}): ${ethers.formatUnits(tokenBalance, tokenDecimal)} ${tokenName}`);

    const transferAmount = ethers.parseUnits(amount, tokenDecimal);
    console.log(`Transferring ${ethers.formatUnits(transferAmount, tokenDecimal)} ${tokenName} to recipient (${recipient})`);

    try {
        const tx = await tokenContract.transfer(recipient, transferAmount);
        console.log("Transaction sent, waiting for confirmation...");
        await tx.wait();
        console.log(`Successfully transferred ${ethers.formatUnits(transferAmount, 18)} ${tokenName} to ${recipient}`);

        tokenBalance = await tokenContract.balanceOf(impersonatedSigner.address);
        console.log(`Remaining ${tokenName} Balance of whale (${impersonatedSigner.address}): ${ethers.formatUnits(tokenBalance, tokenDecimal)} ${tokenName}`);
    } catch (error) {
        console.error(`Error during ${tokenName} transfer:`, error);
    }
}

async function main() {
    try {
        // const LimitOrderProtocol = await ethers.getContractFactory('LimitOrderProtocol');
        // const swap = await LimitOrderProtocol.deploy(WETH_ADDRESS);
        // await swap.waitForDeployment();

        let makerWallet, takerWallet;
        [makerWallet, takerWallet] = await ethers.getSigners();
        // fund maker address with WETH
        await transferTokenFromWhale({
        recipient: makerWallet.address,
        holder: WETH_HOLDER,
        tokenName: "WETH",
        tokenAddress: WETH_ADDRESS
        });

        // fund taker address with USDC
        // USDC whale needs ETH for gas
        const tx = await takerWallet.sendTransaction({
            to: USDC_HOLDER,
            value: ethers.parseEther("0.1"), // Convert to wei
        });

        await transferTokenFromWhale({
            recipient: makerWallet.address,
            holder: USDC_HOLDER,
            tokenName: "USDC",
            tokenAddress: USDC_ADDRESS,
            amount: "100000",
            tokenDecimal: 6
        });


        // buildOrder
        const now = await time.latest();
        const start = now + 60;
        const end = now + 600;

        const twapExtraData = ethers.AbiCoder.defaultAbiCoder().encode([
            "uint256", "uint256", "uint256", "uint256", "address", "uint8", "uint8"
        ], [start, 60, ether('1'), ether('10'), PRICE_ORACLE_ADDRESS, 18, 6]);
        

        const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bool", "address", "tuple(uint256,uint256,address,bytes)[]"],
        [
            true,
            PRICE_ORACLE_ADDRESS,
            [
            [start, end, TWAP_CALCULATOR_ADDRESS, twapExtraData]
            ]
        ]
        );

        const order = buildOrder({
            makerAsset: WETH_ADDRESS,
            takerAsset: USDC_ADDRESS,
            makingAmount: ether('5'),
            takingAmount: 0,
            maker: makerWallet.address
        }, { 
            makingAmountData: ethers.solidityPacked(
                ['address','bytes'],
                [MULTIPHASE_CALCULATOR_ADDRESS,extraData],
            ),
            takingAmountData: ethers.solidityPacked(
                ['address','bytes'],
                [MULTIPHASE_CALCULATOR_ADDRESS,extraData],
            ),
        });
        console.log("ORDER!",order)
        
        const chainId = (await ethers.provider.getNetwork()).chainId;
        const signature = await signOrder(order, chainId, ONEINCH_V6_ADDRESS, makerWallet);
                   
        // const signature = await signOrder(order, chainId, LOP_ADDRESS, makerWallet);
        console.log(signature)

        // const swap = getLOPContract(makerWallet);
        const swap = new ethers.Contract(ONEINCH_V6_ADDRESS, limitOrderAbi, makerWallet);

        await time.increaseTo(start + 180);

        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        const takerTraits = buildTakerTraits({
            makingAmount: true,
            extension: order.extension,
            threshold: ether('3200')
        });

        swap.connect(takerWallet).fillOrderArgs(order, r, vs, ether('1'), takerTraits.traits, takerTraits.args)


    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
