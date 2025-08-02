import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Wallet,
  DollarSign,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "@/config/addresses";
import swapAbi from "@/abi/swap.json";
import { buildTakerTraits } from "@/utils/orderUtils";
import { ether } from "@/utils/wallet";

const TestFill = () => {
  const { strategyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const strategy = location.state?.strategy;

  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [fillAmount, setFillAmount] = useState("");
  const [minTakingAmount, setMinTakingAmount] = useState("");
  const [currentMarketPrice] = useState("2,845.32"); // Mock current price

  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts.length > 0) {
          setIsConnected(true);
          setWalletAddress(accounts[0]);
          toast({
            title: "Wallet Connected",
            description: "Successfully connected to MetaMask",
          });
        }
      } else {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask to continue",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleSubmitFill = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!fillAmount || !minTakingAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the order and signature from the strategy
      const order = strategy.order;
      const signature = strategy.signature;
      console.log("order",order)
      console.log("st",strategy)

      if (!order || !signature) {
        toast({
          title: "Order Not Found",
          description: "Order data or signature is missing",
          variant: "destructive",
        });
        return;
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const taker = await provider.getSigner();
      
      // Create swap contract instance
      const swap = new ethers.Contract(CONTRACT_ADDRESSES.SWAP, swapAbi.abi, taker);
      
      // Extract r and vs from signature
      const { r, yParityAndS: vs } = ethers.Signature.from(signature);
      
      // Build taker traits
      const takerTraits = buildTakerTraits({
        makingAmount: true,
        extension: order.extension,
        threshold: ether('0.226') // buffer for rounding

      });
      
      // Execute the fill
      const result = await swap.fillOrderArgs(
        order, 
        r, 
        vs, 
        ether('900'), 

        // ether(fillAmount), 
        takerTraits.traits, 
        takerTraits.args
      );
      
      console.log("Fill result:", result);
      
      toast({
        title: "Fill Submitted",
        description: `Successfully submitted fill for ${fillAmount} ${strategy?.makerToken?.symbol}`,
      });

      // Navigate back to monitor after a short delay
      setTimeout(() => {
        navigate("/monitor");
      }, 2000);
      
    } catch (error) {
      console.error('Fill order error:', error);
      toast({
        title: "Fill Failed",
        description: "Failed to fill order. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!strategy) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-8 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Strategy Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The requested strategy could not be found.
              </p>
              <Button onClick={() => navigate("/monitor")}>
                Back to Monitor
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-8 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header Section */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/monitor")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Monitor
            </Button>
            
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent font-inter tracking-tight">
                Test Fill Order
              </h1>
              <p className="text-muted-foreground text-xl max-w-3xl mx-auto font-inter font-light leading-relaxed">
                Fill a portion of the selected strategy order
              </p>
              <div className="w-24 h-1 bg-gradient-primary rounded-full mx-auto"></div>
            </div>
          </div>

          {/* Strategy Details */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Order Details</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-accent">
                    {strategy.type}
                  </Badge>
                  <Badge className="bg-primary text-primary-foreground">
                    {strategy.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Token Pair</p>
                    <p className="font-semibold text-lg">
                      {strategy.makerToken.symbol} → {strategy.takerToken.symbol}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-semibold text-lg">
                      {strategy.makerAmount} {strategy.makerToken.symbol}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Market Price</p>
                    <p className="font-semibold text-lg">${currentMarketPrice}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Connection */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Wallet Connection</CardTitle>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Connect your MetaMask wallet to proceed with the fill
                  </p>
                  <Button
                    variant="wallet"
                    onClick={connectWallet}
                    className="flex items-center gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect MetaMask
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Wallet Connected</p>
                      <p className="text-sm text-muted-foreground">{formatAddress(walletAddress)}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600 text-white">Connected</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fill Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Fill Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fillAmount">
                  Fill Amount ({strategy.makerToken.symbol})
                </Label>
                <Input
                  id="fillAmount"
                  type="number"
                  placeholder="Enter amount to fill"
                  value={fillAmount}
                  onChange={(e) => setFillAmount(e.target.value)}
                  disabled={!isConnected}
                />
                <p className="text-sm text-muted-foreground">
                  Available: {parseFloat(strategy.makerAmount) - parseFloat(strategy.totalFilled)} {strategy.makerToken.symbol}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minTakingAmount">
                  Minimum Taking Amount ({strategy.takerToken.symbol})
                </Label>
                <Input
                  id="minTakingAmount"
                  type="number"
                  placeholder="Enter minimum amount you want to receive"
                  value={minTakingAmount}
                  onChange={(e) => setMinTakingAmount(e.target.value)}
                  disabled={!isConnected}
                />
                <p className="text-sm text-muted-foreground">
                  Specify the minimum amount of {strategy.takerToken.symbol} you're willing to accept
                </p>
              </div>

              <Separator />

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/monitor")}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitFill}
                  disabled={!isConnected || !fillAmount || !minTakingAmount}
                  className="flex items-center gap-2"
                >
                  Submit Fill
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TestFill;