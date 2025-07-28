import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketPriceListener } from "../MarketPriceListener";
import { Clock, TrendingUp } from "lucide-react";

interface TWAPBlockProps {
  id: string;
  onUpdate?: (id: string, data: any) => void;
}

export const TWAPBlock = ({ id, onUpdate }: TWAPBlockProps) => {
  const [makerAmount, setMakerAmount] = useState("");
  const [interval, setInterval] = useState("");
  const [chunkSize, setChunkSize] = useState("");
  const [priceListenerEnabled, setPriceListenerEnabled] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const handleUpdate = () => {
    onUpdate?.(id, {
      type: "TWAP",
      makerAmount,
      interval,
      chunkSize,
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
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          TWAP Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maker-amount">Maker Amount</Label>
            <Input
              id="maker-amount"
              type="number"
              placeholder="1000"
              value={makerAmount}
              onChange={(e) => setMakerAmount(e.target.value)}
              onBlur={handleUpdate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interval">Interval (minutes)</Label>
            <Input
              id="interval"
              type="number"
              placeholder="5"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              onBlur={handleUpdate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chunk-size">Chunk Size</Label>
            <Input
              id="chunk-size"
              type="number"
              placeholder="100"
              value={chunkSize}
              onChange={(e) => setChunkSize(e.target.value)}
              onBlur={handleUpdate}
            />
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