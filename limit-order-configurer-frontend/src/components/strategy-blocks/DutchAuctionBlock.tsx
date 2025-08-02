import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketPriceListener } from "../MarketPriceListener";
import { TrendingDown } from "lucide-react";

interface DutchAuctionBlockProps {
  id: string;
  onUpdate?: (id: string, data: any) => void;
}

export const DutchAuctionBlock = ({ id, onUpdate }: DutchAuctionBlockProps) => {
  const [takingAmountStart, setTakingAmountStart] = useState("");
  const [takingAmountEnd, setTakingAmountEnd] = useState("");
  const [priceListenerEnabled, setPriceListenerEnabled] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const handleUpdate = () => {
    onUpdate?.(id, {
      type: "DUTCH_AUCTION",
      takingAmountStart,
      takingAmountEnd,
      priceListener: {
        enabled: priceListenerEnabled,
        minPrice,
        maxPrice,
      },
    });
  };

  return (
    <Card className="w-full bg-card border border-border shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center border">
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
          </div>
          Dutch Auction Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taking-amount-start">Taking Amount Start</Label>
            <Input
              id="taking-amount-start"
              type="number"
              placeholder="3"
              value={takingAmountStart}
              onChange={(e) => setTakingAmountStart(e.target.value)}
              onBlur={handleUpdate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taking-amount-end">Taking Amount End</Label>
            <Input
              id="taking-amount-end"
              type="number"
              placeholder="2"
              value={takingAmountEnd}
              onChange={(e) => setTakingAmountEnd(e.target.value)}
              onBlur={handleUpdate}
            />
          </div>
        </div>

        {/* Price decline visualization */}
        <div className="bg-gradient-secondary p-3 rounded-lg">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Price Decline</span>
            <span>Over Time</span>
          </div>
          <div className="relative h-8 bg-primary/10 rounded-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-primary rounded-lg transition-all duration-1000"
              style={{
                clipPath: "polygon(0 0, 100% 50%, 100% 100%, 0 100%)"
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-primary">{takingAmountStart || "---"} ETH</span>
            <span className="text-primary">{takingAmountEnd || "---"} ETH</span>
          </div>
        </div>

        <MarketPriceListener
          enabled={priceListenerEnabled}
          onEnabledChange={(enabled) => {
            setPriceListenerEnabled(enabled);
            handleUpdate();
          }}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={(price) => {
            setMinPrice(price);
            handleUpdate();
          }}
          onMaxPriceChange={(price) => {
            setMaxPrice(price);
            handleUpdate();
          }}
        />
      </CardContent>
    </Card>
  );
};