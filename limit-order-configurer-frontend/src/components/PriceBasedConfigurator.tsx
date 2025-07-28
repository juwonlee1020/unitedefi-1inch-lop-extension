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
  strategy: "TWAP" | "RANGE_LIMIT" | "DUTCH_AUCTION";
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
    <Card className="w-full bg-card border border-border shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center border">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          Price-based Strategy Ranges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ranges.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No price ranges defined. Add a range to get started.
          </div>
        )}

        {ranges.map((range, index) => (
          <div key={range.id} className="flex items-center gap-3 p-3 bg-gradient-secondary rounded-lg">
            <div className="flex items-center gap-2 flex-1">
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Min Price ($)</Label>
                <Input
                  type="number"
                  value={range.minPrice}
                  onChange={(e) => updateRange(range.id, "minPrice", Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Max Price ($)</Label>
                <Input
                  type="number"
                  value={range.maxPrice}
                  onChange={(e) => updateRange(range.id, "maxPrice", Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Strategy</Label>
                <Select
                  value={range.strategy}
                  onValueChange={(value) => updateRange(range.id, "strategy", value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TWAP">TWAP</SelectItem>
                    <SelectItem value="RANGE_LIMIT">Range Limit</SelectItem>
                    <SelectItem value="DUTCH_AUCTION">Dutch Auction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeRange(range.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addRange}
          className="w-full border-dashed border-primary/50 hover:border-primary hover:bg-primary/5"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Price Range
        </Button>

        {/* Price range visualization */}
        {ranges.length > 0 && (
          <div className="bg-gradient-secondary p-4 rounded-lg">
            <div className="text-sm font-medium mb-3">Price Range Preview</div>
            <div className="space-y-3">
              {ranges
                .sort((a, b) => a.minPrice - b.minPrice)
                .map((range, index) => (
                  <div key={range.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>${range.minPrice}</span>
                      <span className="font-medium">{getStrategyLabel(range.strategy)}</span>
                      <span>${range.maxPrice}</span>
                    </div>
                    <div className={`h-3 rounded-full border ${getStrategyColor(range.strategy)}`}>
                      <div className="h-full bg-gradient-primary rounded-full w-full opacity-60"></div>
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