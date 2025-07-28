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
  const [startPrice, setStartPrice] = useState("");
  const [endPrice, setEndPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [priceListenerEnabled, setPriceListenerEnabled] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const handleUpdate = () => {
    onUpdate?.(id, {
      type: "DUTCH_AUCTION",
      startPrice,
      endPrice,
      duration,
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-price">Start Price</Label>
            <Input
              id="start-price"
              type="number"
              placeholder="3500"
              value={startPrice}
              onChange={(e) => setStartPrice(e.target.value)}
              onBlur={handleUpdate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-price">End Price</Label>
            <Input
              id="end-price"
              type="number"
              placeholder="3000"
              value={endPrice}
              onChange={(e) => setEndPrice(e.target.value)}
              onBlur={handleUpdate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="24"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
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
            <span className="text-primary">${startPrice || "---"}</span>
            <span className="text-muted-foreground">${duration || "---"}h</span>
            <span className="text-primary">${endPrice || "---"}</span>
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