import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TWAPBlock } from "./strategy-blocks/TWAPBlock";
import { RangeLimitBlock } from "./strategy-blocks/RangeLimitBlock";
import { DutchAuctionBlock } from "./strategy-blocks/DutchAuctionBlock";
import { TransitionRule } from "./TransitionRule";
import { Plus, Settings, Play } from "lucide-react";
import { toast } from "sonner";

interface StrategyBlock {
  id: string;
  type: "TWAP" | "RANGE_LIMIT" | "DUTCH_AUCTION";
  data?: any;
}

interface Transition {
  id: string;
  data?: any;
}

export const StrategyConfigurator = () => {
  const [blocks, setBlocks] = useState<StrategyBlock[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);

  const addBlock = (type: StrategyBlock["type"]) => {
    const newBlock: StrategyBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
    };
    setBlocks([...blocks, newBlock]);
    toast.success(`${type.replace("_", " ")} block added!`);
  };

  const addTransition = () => {
    const newTransition: Transition = {
      id: `transition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setTransitions([...transitions, newTransition]);
    toast.success("Transition rule added!");
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
    toast.success("Block removed!");
  };

  const removeTransition = (id: string) => {
    setTransitions(transitions.filter(transition => transition.id !== id));
    toast.success("Transition rule removed!");
  };

  const updateBlock = (id: string, data: any) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, data } : block
    ));
  };

  const updateTransition = (id: string, data: any) => {
    setTransitions(transitions.map(transition => 
      transition.id === id ? { ...transition, data } : transition
    ));
  };

  const executeStrategy = () => {
    if (blocks.length === 0) {
      toast.error("Add at least one strategy block to execute!");
      return;
    }
    toast.success("Strategy configuration saved! Ready for execution.");
  };

  const renderBlock = (block: StrategyBlock) => {
    const commonProps = {
      id: block.id,
      onUpdate: updateBlock,
    };

    switch (block.type) {
      case "TWAP":
        return <TWAPBlock key={block.id} {...commonProps} />;
      case "RANGE_LIMIT":
        return <RangeLimitBlock key={block.id} {...commonProps} />;
      case "DUTCH_AUCTION":
        return <DutchAuctionBlock key={block.id} {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Add Strategy Blocks */}
      <Card className="p-6 bg-gradient-secondary border-none">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          Strategy Builder
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="strategy"
            onClick={() => addBlock("TWAP")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add TWAP Block
          </Button>
          <Button
            variant="strategy"
            onClick={() => addBlock("RANGE_LIMIT")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Range Limit Block
          </Button>
          <Button
            variant="strategy"
            onClick={() => addBlock("DUTCH_AUCTION")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Dutch Auction Block
          </Button>
        </div>
      </Card>

      {/* Strategy Flow */}
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div key={block.id} className="space-y-4">
            <div className="relative group">
              {renderBlock(block)}
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeBlock(block.id)}
              >
                Remove
              </Button>
            </div>

            {/* Add transition after each block except the last */}
            {index < blocks.length - 1 && (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addTransition}
                  className="border border-dashed border-primary/50 hover:border-primary hover:bg-primary/5"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transition Rule
                </Button>
              </div>
            )}

            {/* Show transitions */}
            {transitions.slice(index, index + 1).map(transition => (
              <TransitionRule
                key={transition.id}
                id={transition.id}
                onRemove={removeTransition}
                onUpdate={updateTransition}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {blocks.length === 0 && (
        <Card className="p-12 text-center bg-gradient-accent border-none">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Build Your Strategy</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start by adding strategy blocks above. Combine TWAP, Range Limits, and Dutch Auctions 
              with conditional transitions to create sophisticated trading strategies.
            </p>
          </div>
        </Card>
      )}

      {/* Execute Strategy */}
      {blocks.length > 0 && (
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
      )}
    </div>
  );
};