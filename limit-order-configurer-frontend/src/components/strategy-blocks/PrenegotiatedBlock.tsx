import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserCheck, Plus, X } from "lucide-react";

interface PregnegotiatedBlockProps {
  id: string;
  onUpdate?: (id: string, data: any) => void;
}

export const PregnegotiatedBlock = ({ id, onUpdate }: PregnegotiatedBlockProps) => {
  const [fixedPrice, setFixedPrice] = useState("");
  const [whitelistAddresses, setWhitelistAddresses] = useState<string[]>([""]);

  const handleUpdate = () => {
    onUpdate?.(id, {
      type: "PRENEGOTIATED",
      fixedPrice,
      whitelistAddresses: whitelistAddresses.filter(addr => addr.trim() !== ""),
    });
  };

  const addAddress = () => {
    setWhitelistAddresses([...whitelistAddresses, ""]);
  };

  const removeAddress = (index: number) => {
    if (whitelistAddresses.length > 1) {
      const newAddresses = whitelistAddresses.filter((_, i) => i !== index);
      setWhitelistAddresses(newAddresses);
      handleUpdate();
    }
  };

  const updateAddress = (index: number, value: string) => {
    const newAddresses = [...whitelistAddresses];
    newAddresses[index] = value;
    setWhitelistAddresses(newAddresses);
  };

  return (
    <Card className="w-full bg-card border border-border shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center border">
            <UserCheck className="w-4 h-4 text-muted-foreground" />
          </div>
          Prenegotiated Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fixed-price">Fixed Price</Label>
          <Input
            id="fixed-price"
            type="number"
            placeholder="1500"
            value={fixedPrice}
            onChange={(e) => setFixedPrice(e.target.value)}
            onBlur={handleUpdate}
          />
        </div>

        <div className="space-y-3">
          <Label>Whitelist Dealer Addresses</Label>
          {whitelistAddresses.map((address, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="text"
                placeholder="0x..."
                value={address}
                onChange={(e) => updateAddress(index, e.target.value)}
                onBlur={handleUpdate}
                className="font-mono text-sm"
              />
              {whitelistAddresses.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeAddress(index)}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addAddress}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        </div>

        {/* Strategy visualization */}
        <div className="bg-gradient-secondary p-3 rounded-lg">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Fixed Price Trading</span>
            <span>Whitelist Only</span>
          </div>
          <div className="relative h-8 bg-primary/10 rounded-lg overflow-hidden">
            <div className="h-full bg-gradient-primary rounded-lg"></div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-primary">{fixedPrice || "---"} USD</span>
            <span className="text-muted-foreground">
              {whitelistAddresses.filter(addr => addr.trim() !== "").length} dealers
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};