// Auto-generated by deployLocalAndLogAddresses.ts

export const CONTRACT_ADDRESSES = {
  SWAP: '0xF31c1E4a4339Df9E85f8D3f26Fb4f9C2E095a9EB',
  DAI: '0x6599c6f3E66A5Cd86bA7F826BA7d56CC5d3196FA',
  WETH: '0x1E430CE702C8f7903BF0522Eae7faeB32634F1D2',
  DUTCH_CALCULATOR: '0xD4B10Be92Db6A7b08e09D7509dF9b889d297Da1C',
  TWAP_CALCULATOR: '0xA01094a9397659FC396C35B0a1a7bE3bDAb98E00',
  MULTIPHASE_CALCULATOR: '0x9A29e9Bab1f0B599d1c6C39b60a79596b3875f56',
  DAI_ORACLE: '0xFb0a39aE8c44a0E83a1445d4d272294345fA2207',
} as const;


export interface Token {
  name: string;
  address: string;
  symbol: string;
  decimal: number;
}

export const AVAILABLE_TOKENS: Token[] = [
  {
    name: "Dai Stablecoin",
    address: CONTRACT_ADDRESSES.DAI,
    symbol: "DAI",
    decimal: 18
  },
  {
    name: "Wrapped Ether",
    address: CONTRACT_ADDRESSES.WETH,
    symbol: "WETH",
    decimal: 18
  }
  // Add more tokens as needed
];