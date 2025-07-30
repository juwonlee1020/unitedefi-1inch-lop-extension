import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp } from "lucide-react";
import { RootState } from "@/store";
import { setWalletAddress, disconnectWallet } from "@/store/walletSlice";

export const Header = () => {
  const dispatch = useDispatch();
  const address = useSelector((state: RootState) => state.wallet.address);
  const isConnected = useSelector((state: RootState) => state.wallet.isConnected);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install it.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        dispatch(setWalletAddress(accounts[0]));
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          dispatch(setWalletAddress(accounts[0]));
        }
      }
    };

    checkConnection();

    window.ethereum?.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length > 0) {
        dispatch(setWalletAddress(accounts[0]));
      } else {
        dispatch(disconnectWallet());
      }
    });
  }, [dispatch]);

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
          {isConnected && address ? formatAddress(address) : "Connect Wallet"}
        </Button>
      </div>
    </header>
  );
};
