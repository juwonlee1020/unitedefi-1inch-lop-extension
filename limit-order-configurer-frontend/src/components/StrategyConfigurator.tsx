import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TransitionTypeSelector } from "./TransitionTypeSelector";
import { TimeBasedConfigurator } from "./TimeBasedConfigurator";
import { PriceBasedConfigurator } from "./PriceBasedConfigurator";
import { StrategySettingsPanel } from "./StrategySettingsPanel";
import { Play } from "lucide-react";
import { toast } from "sonner";

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

  const executeStrategy = () => {
    const usedStrategies = getUsedStrategies();
    if (usedStrategies.length === 0) {
      toast.error("Configure at least one strategy to execute!");
      return;
    }
    
    const hasIntervals = transitionType === "time" ? timeIntervals.length > 0 : priceRanges.length > 0;
    if (!hasIntervals) {
      toast.error(`Add at least one ${transitionType}-based rule to execute!`);
      return;
    }
    
    toast.success("Strategy configuration saved! Ready for execution.");
  };


  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Transition Type Selector */}
      <TransitionTypeSelector
        selected={transitionType}
        onSelect={setTransitionType}
      />

      {/* Configurator based on selected type */}
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

      {/* Strategy Settings Panel */}
      <StrategySettingsPanel
        usedStrategies={getUsedStrategies()}
        onStrategyUpdate={handleStrategyUpdate}
      />

      {/* Execute Strategy */}
      <div className="flex justify-center pt-6">
        <Button
          variant="default"
          size="lg"
          onClick={executeStrategy}
          className="flex items-center gap-2 px-8"
        >
          <Play className="w-5 h-5" />
          Execute Strategy
        </Button>
      </div>
    </div>
  );
};