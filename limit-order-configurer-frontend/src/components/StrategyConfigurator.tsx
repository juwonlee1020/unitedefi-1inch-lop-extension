import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OrderParametersForm } from "./OrderParametersForm";
import { TransitionTypeSelector } from "./TransitionTypeSelector";
import { TimeBasedConfigurator } from "./TimeBasedConfigurator";
import { PriceBasedConfigurator } from "./PriceBasedConfigurator";
import { StrategySettingsPanel } from "./StrategySettingsPanel";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { buildOrder, signOrder, buildTakerTraits } from "@/utils/orderUtils";
import { getSigner, getContract, ether } from "@/utils/wallet";
import { getAddress } from "ethers";
import { ethers } from 'ethers';
import abi from '../abi/limitOrderProtocol.json'; // adjust path if needed
import swapabi from '../abi/swap.json'; // adjust path if needed
import { CONTRACT_ADDRESSES } from "@/config/addresses";


interface TimeInterval {
  id: string;
  startTime: number;
  endTime: number;
  strategy: "TWAP" | "RANGE_LIMIT" | "DUTCH_AUCTION";
}

interface PriceRange {
  id: string;
  minPrice: number;
  maxPrice: number;
  strategy: "TWAP" | "RANGE_LIMIT" | "DUTCH_AUCTION";
}

export const StrategyConfigurator = () => {
  const [transitionType, setTransitionType] = useState<"time" | "price">("time");
  const [timeIntervals, setTimeIntervals] = useState<TimeInterval[]>([]);
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>([]);
  const [strategySettings, setStrategySettings] = useState<Record<string, any>>({});
  const [order, setOrder] = useState();
  const [signature, setSignature] = useState();
  const SWAP_ADDRESS = CONTRACT_ADDRESSES.SWAP;
  const DAI_ADDRESS = CONTRACT_ADDRESSES.DAI;
  const DAI_ORACLE_ADDRESS = CONTRACT_ADDRESSES.DAI_ORACLE;
  const WETH_ADDRESS = CONTRACT_ADDRESSES.WETH;
  const DUTCH_CALCULATOR_ADDRESS = CONTRACT_ADDRESSES.DUTCH_CALCULATOR;
  const TWAP_ADDRESS = CONTRACT_ADDRESSES.TWAP_CALCULATOR;
  const MULTIPHASE_ADDRESS = CONTRACT_ADDRESSES.MULTIPHASE_CALCULATOR;

  const getUsedStrategies = (): ("TWAP" | "RANGE_LIMIT" | "DUTCH_AUCTION")[] => {
    const strategies = new Set<"TWAP" | "RANGE_LIMIT" | "DUTCH_AUCTION">();
    
    if (transitionType === "time") {
      timeIntervals.forEach(interval => strategies.add(interval.strategy));
    } else {
      priceRanges.forEach(range => strategies.add(range.strategy));
    }
    
    return Array.from(strategies);
  };

  const handleStrategyUpdate = (strategy: string, data: any) => {
    setStrategySettings(prev => ({
      ...prev,
      [strategy]: data
    }));
  };

  async function executeStrategy(){
    // const usedStrategies = getUsedStrategies();
    // if (usedStrategies.length === 0) {
    //   toast.error("Configure at least one strategy to execute!");
    //   return;
    // }
    
    // const hasIntervals = transitionType === "time" ? timeIntervals.length > 0 : priceRanges.length > 0;
    // if (!hasIntervals) {
    //   toast.error(`Add at least one ${transitionType}-based rule to execute!`);
    //   return;
    // }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const maker = await provider.getSigner();

    // const startEndTs = "596806566623866304071545085164385126479704034533";
    // const order = buildOrder(
    //     {
    //         makerAsset: DAI_ADDRESS,
    //         takerAsset: WETH_ADDRESS_LOCAL,
    //         makingAmount: ether('100'),
    //         takingAmount: ether('0.1'),
    //         maker: maker.address,
    //     },
    //     {
    //         makingAmountData: ethers.solidityPacked(
    //             ['address', 'uint256', 'uint256', 'uint256'],
    //             [DUTCH_CALCULATOR_ADDRESS, startEndTs, ether('0.1'), ether('0.05')],
    //         ),
    //         takingAmountData: ethers.solidityPacked(
    //             ['address', 'uint256', 'uint256', 'uint256'],
    //             [DUTCH_CALCULATOR_ADDRESS,startEndTs, ether('0.1'), ether('0.05')],
    //         ),
    //     },
    // );
    // const signature = await signOrder(order, 31337, SWAP_ADDRESS, maker);
    const latestBlock = await provider.getBlock("latest");

    const now = latestBlock.timestamp;
    const start = now + 60;   // start in 1 minute
    const end = now + 600;    // end in 10 minutes


    // const now = await time.latest();
    // const start = now + 60;
    // const end = now + 600;

    const twapExtraData = ethers.AbiCoder.defaultAbiCoder().encode([
        "uint256", "uint256", "uint256", "uint256", "address", "uint8", "uint8"
    ], [start, 60, ether('1'), ether('10'), DAI_ORACLE_ADDRESS, 18, 6]);
    

    const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
    ["bool", "address", "tuple(uint256,uint256,address,bytes)[]"],
    [
        true,
        DAI_ORACLE_ADDRESS,
        [
        [start, end, TWAP_ADDRESS, twapExtraData]
        ]
    ]
    );

    const order = buildOrder({
        makerAsset:  DAI_ADDRESS,
        takerAsset: WETH_ADDRESS,
        makingAmount: ether('10'),
        takingAmount: 0,
        maker: maker.address
    }, { 
        makingAmountData: ethers.solidityPacked(
            ['address','bytes'],
            [MULTIPHASE_ADDRESS,extraData],
        ),
        takingAmountData: ethers.solidityPacked(
            ['address','bytes'],
            [MULTIPHASE_ADDRESS,extraData],
        ),
    });

                
    const signature = await signOrder(order, 31337, SWAP_ADDRESS, maker);

    setOrder(order);
    setSignature(signature);
    toast.success(signature);
  };

  async function fillOrder(){
    const SIG = "0xca199bf3ae66174695e19b5e5be931b36782965bf427c2aeb1127ca56aff8f0a6cab8220ba08a221cd03cdde664bb429d844fba041b0127447e331818c3b68b31b";
    console.log(signature);
    console.log("SIG",SIG)
    console.log("ORDER",order)
    const provider = new ethers.BrowserProvider(window.ethereum);
    const taker = await provider.getSigner();
    const swap = new ethers.Contract(SWAP_ADDRESS, swapabi.abi, taker);
    
    const { r, yParityAndS: vs } = ethers.Signature.from(signature);
    // const takerTraits = buildTakerTraits({
    //     makingAmount: true,
    //     extension: order.extension,
    //     threshold: ether('0.08'),
    // });
      const takerTraits = buildTakerTraits({
        makingAmount: true,
        extension: order.extension,
        threshold: ether('3200')
    });
    const result = await swap.fillOrderArgs(order, r, vs, ether('1'), takerTraits.traits, takerTraits.args);
    console.log(result)

  }


  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="max-w-6xl mx-auto p-8 space-y-10">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-16 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent font-inter tracking-tight">
            Strategy Configuration
          </h1>
          <p className="text-muted-foreground text-xl max-w-3xl mx-auto font-inter font-light leading-relaxed">
            Design your trading strategy with intelligent timing or price-based transitions
          </p>
          <div className="w-24 h-1 bg-gradient-primary rounded-full mx-auto"></div>
        </div>

        {/* Step 1: Order Parameters */}
        <div className="animate-fade-in">
          <OrderParametersForm />
        </div>

        {/* Step 2: Transition Type Selector */}
        <div className="animate-fade-in space-y-4" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Step 2
            </h2>
            <h3 className="text-2xl font-semibold text-foreground font-inter">
              Choose Transition Logic
            </h3>
          </div>
          <TransitionTypeSelector
            selected={transitionType}
            onSelect={setTransitionType}
          />
        </div>

        {/* Configurator based on selected type */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {transitionType === "time" ? (
            <TimeBasedConfigurator
              intervals={timeIntervals}
              onIntervalsChange={setTimeIntervals}
            />
          ) : (
            <PriceBasedConfigurator
              ranges={priceRanges}
              onRangesChange={setPriceRanges}
            />
          )}
        </div>

        {/* Step 3: Strategy Settings Panel */}
        <div className="animate-fade-in space-y-4" style={{ animationDelay: '0.3s' }}>
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Step 3
            </h2>
            <h3 className="text-2xl font-semibold text-foreground font-inter">
              Configure Strategy Settings
            </h3>
          </div>
          <StrategySettingsPanel
            usedStrategies={getUsedStrategies()}
            onStrategyUpdate={handleStrategyUpdate}
          />
        </div>

        {/* Execute Strategy CTA */}
        <div className="flex justify-center pt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="text-center space-y-6">
            <div className="space-y-3">
              <p className="text-muted-foreground font-inter font-medium">
                Ready to deploy your strategy?
              </p>
              <div className="w-12 h-0.5 bg-gradient-primary rounded-full mx-auto opacity-60"></div>
            </div>
            <Button
              variant="cta"
              onClick={executeStrategy}
              className="group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <Play className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
              Execute Strategy
            </Button>

                        <Button
              variant="cta"
              onClick={fillOrder}
              className="group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <Play className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
              fill Strategy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};