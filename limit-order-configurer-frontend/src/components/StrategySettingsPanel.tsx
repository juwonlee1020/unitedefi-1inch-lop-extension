import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TWAPBlock } from "./strategy-blocks/TWAPBlock";
import { RangeLimitBlock } from "./strategy-blocks/RangeLimitBlock";
import { DutchAuctionBlock } from "./strategy-blocks/DutchAuctionBlock";
import { Settings } from "lucide-react";

interface StrategySettingsPanelProps {
  usedStrategies: ("TWAP" | "RANGE_LIMIT" | "DUTCH_AUCTION")[];
  onStrategyUpdate: (strategy: string, data: any) => void;
}

export const StrategySettingsPanel = ({ usedStrategies, onStrategyUpdate }: StrategySettingsPanelProps) => {
  if (usedStrategies.length === 0) {
    return (
      <Card className="p-8 text-center bg-gradient-accent border-none">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Settings className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Configure Your Strategies</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Select strategies in your time intervals or price ranges above to configure their settings here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-secondary border-none">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          Strategy Configuration
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the settings for your selected strategies
        </p>
      </Card>

      {usedStrategies.includes("TWAP") && (
        <TWAPBlock
          id="twap-settings"
          onUpdate={(id, data) => onStrategyUpdate("TWAP", data)}
        />
      )}

      {usedStrategies.includes("RANGE_LIMIT") && (
        <RangeLimitBlock
          id="range-limit-settings"
          onUpdate={(id, data) => onStrategyUpdate("RANGE_LIMIT", data)}
        />
      )}

      {usedStrategies.includes("DUTCH_AUCTION") && (
        <DutchAuctionBlock
          id="dutch-auction-settings"
          onUpdate={(id, data) => onStrategyUpdate("DUTCH_AUCTION", data)}
        />
      )}
    </div>
  );
};