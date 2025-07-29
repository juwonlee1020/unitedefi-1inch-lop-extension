import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderParameters {
  makerToken: string;
  takerToken: string;
  makerAmount: string;
}

interface OrderParametersFormProps {
  onParametersChange?: (parameters: OrderParameters) => void;
}

export const OrderParametersForm = ({ onParametersChange }: OrderParametersFormProps) => {
  const [parameters, setParameters] = useState<OrderParameters>({
    makerToken: "",
    takerToken: "",
    makerAmount: ""
  });

  const handleParameterChange = (field: keyof OrderParameters, value: string) => {
    const updatedParameters = { ...parameters, [field]: value };
    setParameters(updatedParameters);
    onParametersChange?.(updatedParameters);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Step 1
        </h2>
        <h3 className="text-2xl font-semibold text-foreground font-inter">
          Define Order Parameters
        </h3>
      </div>
      
      <Card className="glass-card border-primary/10">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg font-medium text-foreground">
            Token Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Maker Token */}
            <div className="space-y-3">
              <Label htmlFor="maker-token" className="text-sm font-medium text-foreground">
                Token you are selling
              </Label>
              <Select onValueChange={(value) => handleParameterChange('makerToken', value)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select token to sell" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eth">ETH - Ethereum</SelectItem>
                  <SelectItem value="usdc">USDC - USD Coin</SelectItem>
                  <SelectItem value="usdt">USDT - Tether</SelectItem>
                  <SelectItem value="dai">DAI - Dai Stablecoin</SelectItem>
                  <SelectItem value="wbtc">WBTC - Wrapped Bitcoin</SelectItem>
                  <SelectItem value="custom">Custom Token Address</SelectItem>
                </SelectContent>
              </Select>
              {parameters.makerToken === 'custom' && (
                <Input
                  placeholder="Enter token contract address (0x...)"
                  value={parameters.makerToken}
                  onChange={(e) => handleParameterChange('makerToken', e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Taker Token */}
            <div className="space-y-3">
              <Label htmlFor="taker-token" className="text-sm font-medium text-foreground">
                Token you want to receive
              </Label>
              <Select onValueChange={(value) => handleParameterChange('takerToken', value)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select token to receive" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eth">ETH - Ethereum</SelectItem>
                  <SelectItem value="usdc">USDC - USD Coin</SelectItem>
                  <SelectItem value="usdt">USDT - Tether</SelectItem>
                  <SelectItem value="dai">DAI - Dai Stablecoin</SelectItem>
                  <SelectItem value="wbtc">WBTC - Wrapped Bitcoin</SelectItem>
                  <SelectItem value="custom">Custom Token Address</SelectItem>
                </SelectContent>
              </Select>
              {parameters.takerToken === 'custom' && (
                <Input
                  placeholder="Enter token contract address (0x...)"
                  value={parameters.takerToken}
                  onChange={(e) => handleParameterChange('takerToken', e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          {/* Maker Amount */}
          <div className="space-y-3">
            <Label htmlFor="maker-amount" className="text-sm font-medium text-foreground">
              Total amount to sell
            </Label>
            <Input
              id="maker-amount"
              type="number"
              placeholder="Enter amount (e.g., 100.0)"
              value={parameters.makerAmount}
              onChange={(e) => handleParameterChange('makerAmount', e.target.value)}
              className="h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};