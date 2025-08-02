import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PriceRange {
  id: string;
  minPrice: number;
  maxPrice: number;
  strategy: "TWAP" | "RANGE_LIMIT" | "DUTCH_AUCTION" | "PRENEGOTIATED";
}

interface PriceBasedConfiguratorProps {
  ranges: PriceRange[];
  onRangesChange: (ranges: PriceRange[]) => void;
}

export const PriceBasedConfigurator = ({ ranges, onRangesChange }: PriceBasedConfiguratorProps) => {
  const addRange = () => {
    const newRange: PriceRange = {
      id: `range-${Date.now()}`,
      minPrice: 0,
      maxPrice: 1000,
      strategy: "TWAP"
    };
    onRangesChange([...ranges, newRange]);
    toast.success("Price range added!");
  };

  const removeRange = (id: string) => {
    onRangesChange(ranges.filter(range => range.id !== id));
    toast.success("Price range removed!");
  };

  const updateRange = (id: string, field: keyof PriceRange, value: any) => {
    onRangesChange(ranges.map(range => 
      range.id === id ? { ...range, [field]: value } : range
    ));
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

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case "TWAP": return "bg-blue-500/20 border-blue-500/50";
      case "RANGE_LIMIT": return "bg-green-500/20 border-green-500/50";
      case "DUTCH_AUCTION": return "bg-orange-500/20 border-orange-500/50";
      default: return "bg-primary/20 border-primary/50";
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
            <div className="text-xl font-semibold">Price-based Strategy Ranges</div>
            <div className="text-sm text-muted-foreground font-normal">Define strategies for different market price levels</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {ranges.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center mx-auto">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <div className="font-medium text-foreground">No price ranges defined</div>
              <div className="text-sm text-muted-foreground">Add your first range to configure price-based strategies</div>
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
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min Price ($)</Label>
                    <Input
                      type="number"
                      value={range.minPrice}
                      onChange={(e) => updateRange(range.id, "minPrice", Number(e.target.value))}
                      className="h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max Price ($)</Label>
                    <Input
                      type="number"
                      value={range.maxPrice}
                      onChange={(e) => updateRange(range.id, "maxPrice", Number(e.target.value))}
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
          Add Price Range
        </Button>

        {/* Price range visualization */}
        {ranges.length > 0 && (
          <div className="bg-gradient-accent border border-border/50 p-6 rounded-xl shadow-inner">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <div className="text-sm font-semibold text-foreground">Price Range Preview</div>
            </div>
            <div className="space-y-4">
              {ranges
                .sort((a, b) => a.minPrice - b.minPrice)
                .map((range, index) => (
                  <div key={range.id} className="group space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono bg-background/50 px-2 py-1 rounded text-muted-foreground">${range.minPrice}</span>
                      <span className="font-medium text-foreground bg-primary/10 px-2 py-1 rounded-md">{getStrategyLabel(range.strategy)}</span>
                      <span className="font-mono bg-background/50 px-2 py-1 rounded text-muted-foreground">${range.maxPrice}</span>
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full overflow-hidden border border-border/30">
                      <div className="h-full bg-gradient-primary rounded-full w-full group-hover:scale-105 transition-transform duration-300 shadow-glow"></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};