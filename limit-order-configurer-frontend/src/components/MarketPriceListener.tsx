import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TrendingUp } from "lucide-react";

interface MarketPriceListenerProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (price: string) => void;
  onMaxPriceChange: (price: string) => void;
}

export const MarketPriceListener = ({
  enabled,
  onEnabledChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: MarketPriceListenerProps) => {
  return (
    <Card className="p-4 bg-gradient-accent border-none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium">Market Price Listener</Label>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>
      
      {enabled && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Only allow fills if market price is within this range
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="min-price" className="text-xs">Min Price</Label>
              <Input
                id="min-price"
                type="number"
                placeholder="0.00"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="max-price" className="text-xs">Max Price</Label>
              <Input
                id="max-price"
                type="number"
                placeholder="0.00"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};