import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketPriceListener } from "../MarketPriceListener";
import { BarChart3 } from "lucide-react";

interface RangeLimitBlockProps {
  id: string;
  onUpdate?: (id: string, data: any) => void;
}

export const RangeLimitBlock = ({ id, onUpdate }: RangeLimitBlockProps) => {
  const [priceStart, setPriceStart] = useState("");
  const [priceEnd, setPriceEnd] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [priceListenerEnabled, setPriceListenerEnabled] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const handleUpdate = () => {
    onUpdate?.(id, {
      type: "RANGE_LIMIT",
      priceStart,
      priceEnd,
      totalAmount,
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
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          Range Limit Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price-start">Start Price</Label>
            <Input
              id="price-start"
              type="number"
              placeholder="2800"
              value={priceStart}
              onChange={(e) => setPriceStart(e.target.value)}
              onBlur={handleUpdate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price-end">End Price</Label>
            <Input
              id="price-end"
              type="number"
              placeholder="3200"
              value={priceEnd}
              onChange={(e) => setPriceEnd(e.target.value)}
              onBlur={handleUpdate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="total-amount">Total Amount</Label>
            <Input
              id="total-amount"
              type="number"
              placeholder="1000"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              onBlur={handleUpdate}
            />
          </div>
        </div>

        {/* Mini price range visualization */}
        <div className="bg-gradient-secondary p-3 rounded-lg">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Price Range</span>
            <span>Distribution</span>
          </div>
          <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-primary rounded-full w-3/4 transition-all duration-500"></div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-primary">${priceStart || "---"}</span>
            <span className="text-primary">${priceEnd || "---"}</span>
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