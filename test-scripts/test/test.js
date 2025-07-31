import {
  MakerTraits,
  Address,
  randBigInt,
  default as Sdk
} from "@1inch/limit-order-sdk";
import { Wallet } from "ethers";

// --- Constants ---
const privKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // hardhat test key
const authKey = 'local-dev'; // can be any dummy string
const maker = new Wallet(privKey);

// --- SDK Setup ---
const sdk = new Sdk({
  authKey,
  networkId: 31337, // Replace with 1 for mainnet, or your local chain ID
  httpConnector: {
    get: async () => {
      throw new Error("GET not supported in local environment");
    },
    post: async () => {
      throw new Error("POST not supported in local environment");
    }
  }
});

// --- Timing ---
const expiresIn = 120n; // 2 minutes
const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn;
const UINT_40_MAX = (1n << 48n) - 1n;

// --- Maker Traits ---
const makerTraits = MakerTraits.default()
  .withExpiration(expiration)
  .withNonce(randBigInt(UINT_40_MAX));

// --- Order Definition ---
const order = await sdk.createOrder({
  makerAsset: new Address('0xdac17f958d2ee523a2206206994597c13d831ec7'), // USDT
  takerAsset: new Address('0x111111111117dc0aa78b770fa6a738034120c302'), // 1INCH
  makingAmount: 100_000000n,             // 100 USDT (6 decimals)
  takingAmount: 10_00000000000000000n,   // 10 1INCH (18 decimals)
  maker: new Address(maker.address)
}, makerTraits);

// --- EIP712 Signature ---
const typedData = order.getTypedData();
const signature = await maker.signTypedData(
  typedData.domain,
  { Order: typedData.types.Order },
  typedData.message
);

// --- Output ---
console.log("Order created and signed:");
console.log("Maker:", maker.address);
console.log("Signature:", signature);
console.log("Typed Data:", JSON.stringify(typedData, null, 2));

// Optional: submit order to Fusion backend
// await sdk.submitOrder(order, signature); // Only works with real Fusion backend + authKey
