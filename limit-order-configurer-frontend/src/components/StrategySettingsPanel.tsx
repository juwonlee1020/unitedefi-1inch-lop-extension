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
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary opacity-5 rounded-2xl blur-xl"></div>
        <div className="relative bg-gradient-glass backdrop-blur-xl border border-border/50 rounded-2xl shadow-glass overflow-hidden">
          <div className="p-16 text-center">
            <div className="space-y-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-3xl blur-md animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-accent rounded-3xl flex items-center justify-center shadow-inner">
                  <Settings className="w-12 h-12 text-primary" />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent font-inter">
                  Configure Your Strategies
                </h3>
                <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed font-inter font-light text-lg">
                  Define your transition rules above to unlock advanced strategy configuration options. Each selected strategy will appear here for precise fine-tuning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary opacity-5 rounded-2xl blur-xl"></div>
        <div className="relative bg-gradient-glass backdrop-blur-xl border border-border/50 rounded-2xl shadow-glass overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-gradient-accent rounded-xl shadow-inner">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground font-inter">
                  Strategy Configuration
                </h2>
                <p className="text-muted-foreground font-inter font-light">
                  Fine-tune parameters for your selected strategies
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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