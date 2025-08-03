import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, Plus, Trash2, Activity, DollarSign, BarChart3, Percent } from "lucide-react";
import { toast } from "sonner";

type MarketConditionType = "price-based" | "volatility-based" | "liquidity-based" | "aave-yield-based";

interface MarketConditionRange {
  id: string;
  minValue: number;
  maxValue: number;
  strategy: "TWAP" | "RANGE_LIMIT" | "DUTCH_AUCTION" | "PRENEGOTIATED";
}

interface MarketConditionConfiguratorProps {
  conditionType: MarketConditionType | null;
  onConditionTypeChange: (type: MarketConditionType) => void;
  ranges: MarketConditionRange[];
  onRangesChange: (ranges: MarketConditionRange[]) => void;
}

export const MarketConditionConfigurator = ({ 
  conditionType, 
  onConditionTypeChange, 
  ranges, 
  onRangesChange 
}: MarketConditionConfiguratorProps) => {
  const addRange = () => {
    if (!conditionType) return;
    
    const newRange: MarketConditionRange = {
      id: `range-${Date.now()}`,
      minValue: 0,
      maxValue: getDefaultMaxValue(conditionType),
      strategy: "TWAP"
    };
    onRangesChange([...ranges, newRange]);
    toast.success("Range added!");
  };

  const removeRange = (id: string) => {
    onRangesChange(ranges.filter(range => range.id !== id));
    toast.success("Range removed!");
  };

  const updateRange = (id: string, field: keyof MarketConditionRange, value: any) => {
    onRangesChange(ranges.map(range => 
      range.id === id ? { ...range, [field]: value } : range
    ));
  };

  const getDefaultMaxValue = (type: MarketConditionType) => {
    switch (type) {
      case "price-based": return 1000;
      case "volatility-based": return 100;
      case "liquidity-based": return 10000000;
      case "aave-yield-based": return 10;
      default: return 100;
    }
  };

  const getConditionIcon = (type: MarketConditionType) => {
    switch (type) {
      case "price-based": return DollarSign;
      case "volatility-based": return Activity;
      case "liquidity-based": return BarChart3;
      case "aave-yield-based": return Percent;
    }
  };

  const getConditionLabel = (type: MarketConditionType) => {
    switch (type) {
      case "price-based": return "Price-based";
      case "volatility-based": return "Volatility-based";
      case "liquidity-based": return "Liquidity-based";
      case "aave-yield-based": return "Aave Yield-based";
    }
  };

  const getConditionUnit = (type: MarketConditionType) => {
    switch (type) {
      case "price-based": return "$";
      case "volatility-based": return "%";
      case "liquidity-based": return "TVL";
      case "aave-yield-based": return "% APY";
    }
  };

  const getConditionDescription = (type: MarketConditionType) => {
    switch (type) {
      case "price-based": return "Chainlink Price Feed";
      case "volatility-based": return "Chainlink Market Volatility Index";
      case "liquidity-based": return "Chainlink Uniswap V3 Pool Reserves Feeds";
      case "aave-yield-based": return "Aave Protocol Data Provider";
    }
  };

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case "TWAP": return "TWAP";
      case "RANGE_LIMIT": return "Range Limit";
      case "DUTCH_AUCTION": return "Dutch Auction";
      case "PRENEGOTIATED": return "Prenegotiated";
      default: return strategy;
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-surface border border-border/50 shadow-large">
      <div className="absolute inset-0 bg-gradient-glass"></div>
      <CardHeader className="relative pb-6">
        <CardTitle className="flex items-center gap-3 text-foreground">
          <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-xl font-semibold">Market Condition-based Strategy</div>
            <div className="text-sm text-muted-foreground font-normal">
              Choose market conditions powered by specialized oracles
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {/* Market Condition Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-foreground">Market Condition Type</Label>
          <div className="grid grid-cols-2 gap-3">
            {(["price-based", "volatility-based", "liquidity-based", "aave-yield-based"] as MarketConditionType[]).map((type) => {
              const Icon = getConditionIcon(type);
              return (
                <button
                  key={type}
                  onClick={() => onConditionTypeChange(type)}
                  className={`group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 ${
                    conditionType === type
                      ? "bg-gradient-primary shadow-pink-soft scale-[1.02]"
                      : "bg-gradient-glass border border-border/50 hover:border-primary/30 hover:shadow-medium hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors duration-200 ${
                      conditionType === type 
                        ? "bg-white/20" 
                        : "bg-primary/10 group-hover:bg-primary/20"
                    }`}>
                      <Icon className={`w-4 h-4 ${conditionType === type ? "text-white" : "text-primary"}`} />
                    </div>
                    <div className="space-y-1">
                      <h4 className={`text-sm font-semibold ${
                        conditionType === type ? "text-white" : "text-foreground"
                      }`}>
                        {getConditionLabel(type)}
                      </h4>
                      <p className={`text-xs ${
                        conditionType === type ? "text-white/80" : "text-muted-foreground"
                      }`}>
                        {getConditionDescription(type)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ranges Configuration */}
        {conditionType && (
          <>
            {ranges.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-foreground">No ranges defined</div>
                  <div className="text-sm text-muted-foreground">
                    Add your first range to configure {getConditionLabel(conditionType)} strategies
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {ranges.map((range, index) => (
                <div key={range.id} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-4 p-5 bg-gradient-accent border border-border/50 rounded-xl hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="space-y-2 flex-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Min {getConditionUnit(conditionType)}
                        </Label>
                        <Input
                          type="number"
                          value={range.minValue}
                          onChange={(e) => updateRange(range.id, "minValue", Number(e.target.value))}
                          className="h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Max {getConditionUnit(conditionType)}
                        </Label>
                        <Input
                          type="number"
                          value={range.maxValue}
                          onChange={(e) => updateRange(range.id, "maxValue", Number(e.target.value))}
                          className="h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Strategy</Label>
                        <Select
                          value={range.strategy}
                          onValueChange={(value) => updateRange(range.id, "strategy", value)}
                        >
                          <SelectTrigger className="h-10 bg-background/50 border-border/50 focus:border-primary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TWAP">TWAP</SelectItem>
                            <SelectItem value="RANGE_LIMIT">Range Limit</SelectItem>
                            <SelectItem value="DUTCH_AUCTION">Dutch Auction</SelectItem>
                            <SelectItem value="PRENEGOTIATED">Prenegotiated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRange(range.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={addRange}
              className="w-full border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 h-12 text-primary hover:text-primary transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add {getConditionLabel(conditionType)} Range
            </Button>

            {/* Range visualization */}
            {ranges.length > 0 && (
              <div className="bg-gradient-accent border border-border/50 p-6 rounded-xl shadow-inner">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <div className="text-sm font-semibold text-foreground">{getConditionLabel(conditionType)} Range Preview</div>
                </div>
                <div className="space-y-4">
                  {ranges
                    .sort((a, b) => a.minValue - b.minValue)
                    .map((range, index) => (
                      <div key={range.id} className="group space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono bg-background/50 px-2 py-1 rounded text-muted-foreground">
                            {getConditionUnit(conditionType)}{range.minValue}
                          </span>
                          <span className="font-medium text-foreground bg-primary/10 px-2 py-1 rounded-md">
                            {getStrategyLabel(range.strategy)}
                          </span>
                          <span className="font-mono bg-background/50 px-2 py-1 rounded text-muted-foreground">
                            {getConditionUnit(conditionType)}{range.maxValue}
                          </span>
                        </div>
                        <div className="h-3 bg-muted/30 rounded-full overflow-hidden border border-border/30">
                          <div className="h-full bg-gradient-primary rounded-full w-full group-hover:scale-105 transition-transform duration-300 shadow-glow"></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};