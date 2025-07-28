import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/FormField';
import { DateTimeField } from '@/components/DateTimeField';
import { Heart } from 'lucide-react';

interface OrderData {
  makerAmount: string;
  startTime: Date | undefined;
  interval: string;
  chunkAmount: string;
  totalAmount: string;
  priceFeed: string;
  makerTokenDecimals: string;
  takerTokenDecimals: string;
}

export const TWAPOrderCreator: React.FC = () => {
  const [orderData, setOrderData] = useState<OrderData>({
    makerAmount: '',
    startTime: undefined,
    interval: '',
    chunkAmount: '',
    totalAmount: '',
    priceFeed: '',
    makerTokenDecimals: '',
    takerTokenDecimals: '',
  });

  const updateField = (field: keyof OrderData) => (value: string | Date | undefined) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateOrder = () => {
    console.log('Creating TWAP order:', orderData);
    // Integration point for smart contract logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20">
      {/* Header */}
      <div className="w-full bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
              <Heart className="h-6 w-6 md:h-7 md:w-7 text-primary fill-current" />
              TWAP Order Creator
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
              Break your trades into smarter chunks. Powered by 1inch Fusion.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Configure Your TWAP Order
            </h2>
            <p className="text-sm text-muted-foreground">
              Fill in the details to create your time-weighted average price order
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <FormField
              label="Maker Amount"
              name="makerAmount"
              type="number"
              placeholder="e.g., 1000 USDC"
              tooltip="The total amount of tokens you want to sell"
              value={orderData.makerAmount}
              onChange={updateField('makerAmount')}
              required
            />

            <DateTimeField
              label="Start Time"
              name="startTime"
              tooltip="When the TWAP order should begin executing"
              value={orderData.startTime}
              onChange={updateField('startTime')}
              required
            />

            <FormField
              label="Interval"
              name="interval"
              type="number"
              placeholder="300 (seconds)"
              tooltip="Time interval between each trade execution in seconds"
              value={orderData.interval}
              onChange={updateField('interval')}
              required
            />

            <FormField
              label="Chunk Amount"
              name="chunkAmount"
              type="number"
              placeholder="e.g., 100"
              tooltip="Amount of tokens to trade in each chunk"
              value={orderData.chunkAmount}
              onChange={updateField('chunkAmount')}
              required
            />

            <FormField
              label="Total Amount"
              name="totalAmount"
              type="number"
              placeholder="e.g., 1000"
              tooltip="Total amount of tokens to be traded across all chunks"
              value={orderData.totalAmount}
              onChange={updateField('totalAmount')}
              required
            />

            <FormField
              label="Price Feed"
              name="priceFeed"
              placeholder="0x..."
              tooltip="Ethereum address of the price feed oracle"
              value={orderData.priceFeed}
              onChange={updateField('priceFeed')}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Maker Token Decimals"
                name="makerTokenDecimals"
                type="number"
                placeholder="18"
                tooltip="Number of decimal places for the maker token"
                value={orderData.makerTokenDecimals}
                onChange={updateField('makerTokenDecimals')}
                required
              />

              <FormField
                label="Taker Token Decimals"
                name="takerTokenDecimals"
                type="number"
                placeholder="6"
                tooltip="Number of decimal places for the taker token"
                value={orderData.takerTokenDecimals}
                onChange={updateField('takerTokenDecimals')}
                required
              />
            </div>

            <div className="pt-6">
              <Button
                variant="hero"
                size="lg"
                onClick={handleCreateOrder}
                className="w-full text-lg py-6 rounded-xl"
              >
                Create TWAP Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};