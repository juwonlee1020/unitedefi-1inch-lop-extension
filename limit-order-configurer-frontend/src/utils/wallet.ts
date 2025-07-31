import { BrowserProvider, Contract, parseUnits } from "ethers";

export const getSigner = async () => {
  if (!window.ethereum) throw new Error("MetaMask not installed");

  const provider = new BrowserProvider(window.ethereum);
  return await provider.getSigner();
};


export async function getContract(contractAddress, abi) {
  if (!window.ethereum) {
    throw new Error('No wallet found. Please install MetaMask.');
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(contractAddress, abi, signer);
  return contract;
}

export function ether (num) {
    return parseUnits(num);
}