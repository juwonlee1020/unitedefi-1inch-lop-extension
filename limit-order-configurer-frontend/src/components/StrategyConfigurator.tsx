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
import { useAppDispatch } from "@/store";
import { addStrategy } from "@/store/strategiesSlice";

import { CONTRACT_ADDRESSES } from "@/config/addresses";

// Helper function to serialize BigInt values for Redux storage
const serializeOrderForRedux = (order: any) => {
  const serialized = { ...order };
  
  // Convert BigInt values to strings
  if (typeof serialized.salt === 'bigint') {
    serialized.salt = serialized.salt.toString();
  }
  if (typeof serialized.makingAmount === 'bigint') {
    serialized.makingAmount = serialized.makingAmount.toString();
  }
  if (typeof serialized.takingAmount === 'bigint') {
    serialized.takingAmount = serialized.takingAmount.toString();
  }
  if (typeof serialized.makerTraits === 'bigint') {
    serialized.makerTraits = serialized.makerTraits.toString();
  }
  
  return serialized;
};

interface Token {
  name: string;
  address: string;
  symbol: string;
  decimal: number;
}


interface OrderParameters {
  makerToken: Token | null;
  takerToken: Token | null;
  makerAmount: string;
}

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
  const dispatch = useAppDispatch();

  const [transitionType, setTransitionType] = useState<"time" | "price">("time");
  const [timeIntervals, setTimeIntervals] = useState<TimeInterval[]>([]);
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>([]);
  const [strategySettings, setStrategySettings] = useState<Record<string, any>>({});
  const [orderParameters, setOrderParameters] = useState<OrderParameters>({
    makerToken: null,
    takerToken: null,
    makerAmount: ""
    });

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
  const getStrategyItems = () => {
    if (transitionType === "time") {
      return timeIntervals.map(interval => ({
        id: interval.id,
        type: interval.strategy,
        label: `${interval.strategy} (${new Date(interval.startTime * 1000).toLocaleTimeString()} - ${new Date(interval.endTime * 1000).toLocaleTimeString()})`,
        data: interval
      }));
    } else {
      return priceRanges.map(range => ({
        id: range.id,
        type: range.strategy,
        label: `${range.strategy} ($${range.minPrice} - $${range.maxPrice})`,
        data: range
      }));
    }
  };

  const handleStrategyUpdate = (itemId: string, data: any) => {
    setStrategySettings(prev => ({
      ...prev,
      [itemId]: data
    }));
  };

   const getMultiPhaseCalculatorExtraData = (data: {
    orderParameters: OrderParameters;
    transitionType: "time" | "price";
    timeIntervals: TimeInterval[];
    priceRanges: PriceRange[];
    strategySettings: Record<string, any>;
    usedStrategies: ("TWAP" | "RANGE_LIMIT" | "DUTCH_AUCTION")[];
  }) => {
    // This is where you'll implement your strategy execution logic
    console.log("Executing strategy with data:", data);
    
    // Example: You can now access all the form data
    console.log("Maker Token:", data.orderParameters.makerToken);
    console.log("Taker Token:", data.orderParameters.takerToken);
    console.log("Maker Amount:", data.orderParameters.makerAmount);
    console.log("Transition Type:", data.transitionType);
    console.log("Strategy Settings:", data.strategySettings);
    const strategyArrays: any[] = [];


    const items = data.transitionType === "time" ? data.timeIntervals : data.priceRanges;
    
    items.forEach(item => {
      const strategy = item.strategy;
      let start: number;
      let end: number;
      let contractAddress: string;
      let extraData: string;

      // Get start and end values based on transition type
      if (data.transitionType === "time") {
        start = (item as any).startTime;
        end = (item as any).endTime;
      } else {
        start = (item as any).minPrice;
        end = (item as any).maxPrice;
      }

      // Get contract address based on strategy
      switch (strategy) {
        case "TWAP":
          contractAddress = CONTRACT_ADDRESSES.TWAP_CALCULATOR;
          break;
        case "DUTCH_AUCTION":
          contractAddress = CONTRACT_ADDRESSES.DUTCH_CALCULATOR;
          break;
        // case "RANGE_LIMIT":
        //   // Assuming you have a RANGE_LIMIT_ADDRESS, adjust as needed
        //   contractAddress = TWAP_ADDRESS; // placeholder
        //   break;
        default:
          contractAddress = TWAP_ADDRESS; // fallback
      }

      // Construct extraData based on strategy
      if (strategy === "TWAP") {
        // Get TWAP settings
        const twapSettings = data.strategySettings[(item as any).id] || {};

        const { interval = 60, chunkSize = "1" } = twapSettings;
        
        // Get token decimals
        const makerDecimals = data.orderParameters.makerToken?.decimal || 18;
        const takerDecimals = data.orderParameters.takerToken?.decimal || 18;
        
        // Convert amounts to wei
        const chunkSizeWei = ether(chunkSize);
        const totalAmountWei = ether(data.orderParameters.makerAmount);
        
        // Construct TWAP extra data
        extraData = ethers.AbiCoder.defaultAbiCoder().encode([
          "uint256", "uint256", "uint256", "uint256", "address", "uint8", "uint8"
        ], [
          start, // Use the actual start time
          interval,
          chunkSizeWei,
          totalAmountWei,
          CONTRACT_ADDRESSES.DAI_ORACLE,
          makerDecimals,
          takerDecimals
        ]);
        
        console.log("TWAP Extra Data:", extraData);
        console.log("TWAP Parameters:", {
          startTime: start,
          endTime: end,
          interval,
          chunkSize: chunkSizeWei.toString(),
          totalAmount: totalAmountWei.toString(),
          oracleAddress: CONTRACT_ADDRESSES.DAI_ORACLE,
          makerDecimals,
          takerDecimals
        });
      } else {
        // Placeholder for other strategies - implement as needed
        extraData = "0x";
        console.log(`${strategy} extra data not implemented yet`);
      }

      // Construct the strategy array
      const strategyArray = [start, end, contractAddress, extraData];
      strategyArrays.push(strategyArray);
      
      console.log(`${strategy} Strategy Array:`, strategyArray);
    });

    console.log("All Strategy Arrays:", strategyArrays);
    // Construct final extraData
    const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["bool", "address", "tuple(uint256,uint256,address,bytes)[]"],
      [
        data.transitionType === "time", // true for time-based, false for price-based
        DAI_ORACLE_ADDRESS,
        strategyArrays
      ]
    );
    
    console.log("Final Extra Data:", extraData);
    return extraData;
            // const latestBlock = await provider.getBlock("latest");

    // const now = latestBlock.timestamp;
    // const start = now + 60;   // start in 1 minute
    // const end = now + 600;    // end in 10 minutes

    
    // const twapExtraData = ethers.AbiCoder.defaultAbiCoder().encode([
    //     "uint256", "uint256", "uint256", "uint256", "address", "uint8", "uint8"
    // ], [start, 60, ether('1'), ether('10'), DAI_ORACLE_ADDRESS, 18, 6]);
        
        // console.log("TWAP Extra Data:", twapExtraData);
        // console.log("TWAP Parameters:", {
        //   startTime,
        //   interval,
        //   chunkSize: chunkSizeWei.toString(),
        //   totalAmount: totalAmountWei.toString(),
        //   oracleAddress: CONTRACT_ADDRESSES.DAI_ORACLE,
        //   makerDecimals,
        //   takerDecimals
        // });
      
    
  };

  async function executeStrategy(){
    const usedStrategies = getUsedStrategies();
    const extraData = getMultiPhaseCalculatorExtraData({
          orderParameters,
          transitionType,
          timeIntervals,
          priceRanges,
          strategySettings,
          usedStrategies
        });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const maker = await provider.getSigner();

    const order = buildOrder({
        makerAsset: orderParameters.makerToken?.address,
        takerAsset: orderParameters.takerToken?.address,
        makingAmount: ether(orderParameters.makerAmount),
        takingAmount: ether('0'),
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
    console.log("order", order)
                
    // const signature = await signOrder(order, 31337, CONTRACT_ADDRESSES.SWAP, maker);

    // setOrder(order);
    // setSignature(signature);

  
    // Create strategy name based on used strategies
    const strategyName = usedStrategies.length === 1 
      ? usedStrategies[0] 
      : `Multi-Strategy (${usedStrategies.join(', ')})`;

    // Store strategy in Redux
    dispatch(addStrategy({
      name: strategyName,
      type: usedStrategies[0], // Primary strategy type
      status: 'ACTIVE',
      orderParams: {
        makerToken: orderParameters.makerToken?.symbol || '',
        takerToken: orderParameters.takerToken?.symbol || '',
        makerAmount: orderParameters.makerAmount
      },
      strategyParams: {
        transitionType,
        timeIntervals,
        priceRanges,
        strategySettings,
        usedStrategies
      },
      order: serializeOrderForRedux(order),

      signature
    }));
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
          <OrderParametersForm onParametersChange={setOrderParameters} />


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
            strategyItems={getStrategyItems()}

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