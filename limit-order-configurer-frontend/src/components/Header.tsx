import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp } from "lucide-react";

export const Header = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");

  const connectWallet = async () => {
    if (typeof (window as any).ethereum !== "undefined") {
      try {
        await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await (window as any).ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("Please install MetaMask to connect your wallet");
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center border border-primary/20 shadow-pink-soft">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground font-inter">
            Sway
          </h1>
        </div>
        
        <Button
          variant="wallet"
          onClick={connectWallet}
          className="flex items-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          {isConnected ? formatAddress(address) : "Connect Wallet"}
        </Button>
      </div>
    </header>
  );
};