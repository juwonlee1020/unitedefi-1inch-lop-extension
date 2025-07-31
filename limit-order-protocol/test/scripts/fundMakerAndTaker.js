const hre = require('hardhat');
const { ethers } = hre;

// From mainnet fork
const WETH_HOLDER = '0x2E40DDCB231672285A5312ad230185ab2F14eD2B';
const USDC_HOLDER = "0x55fe002aeff02f77364de339a1292923a15844b8"; // Circle's USDC reserve
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";


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
    amount = "50",
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
        console.log(`Successfully transferred ${ethers.formatUnits(transferAmount, tokenDecimal)} ${tokenName} to ${recipient}`);

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
        console.log("maker address", makerWallet.address)
        console.log("taker address", takerWallet.address)

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
            recipient: takerWallet.address,
            holder: USDC_HOLDER,
            tokenName: "USDC",
            tokenAddress: USDC_ADDRESS,
            amount: "100000",
            tokenDecimal: 6
        });

    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
