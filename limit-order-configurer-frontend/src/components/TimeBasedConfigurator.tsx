import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TimeInterval {
  id: string;
  startTime: number;
  endTime: number;
  strategy: "TWAP" | "RANGE_LIMIT" | "DUTCH_AUCTION" | "PRENEGOTIATED";
}

interface TimeBasedConfiguratorProps {
  intervals: TimeInterval[];
  onIntervalsChange: (intervals: TimeInterval[]) => void;
}

export const TimeBasedConfigurator = ({ intervals, onIntervalsChange }: TimeBasedConfiguratorProps) => {
  const addInterval = () => {
    const newInterval: TimeInterval = {
      id: `interval-${Date.now()}`,
      startTime: intervals.length > 0 ? Math.max(...intervals.map(i => i.endTime)) : 0,
      endTime: intervals.length > 0 ? Math.max(...intervals.map(i => i.endTime)) + 30 : 30,
      strategy: "TWAP"
    };
    onIntervalsChange([...intervals, newInterval]);
    toast.success("Time interval added!");
  };

  const removeInterval = (id: string) => {
    onIntervalsChange(intervals.filter(interval => interval.id !== id));
    toast.success("Time interval removed!");
  };

  const updateInterval = (id: string, field: keyof TimeInterval, value: any) => {
    onIntervalsChange(intervals.map(interval => 
      interval.id === id ? { ...interval, [field]: value } : interval
    ));
  };

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case "TWAP": return "TWAP";
      case "RANGE_LIMIT": return "Range Limit";
      case "DUTCH_AUCTION": return "Dutch Auction";
      case "PRENEGOTIATED": return "Prenegotiated";
      default: return strategy;
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-surface border border-border/50 shadow-large">
      <div className="absolute inset-0 bg-gradient-glass"></div>
      <CardHeader className="relative pb-6">
        <CardTitle className="flex items-center gap-3 text-foreground">
          <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-xl font-semibold">Time-based Strategy Timeline</div>
            <div className="text-sm text-muted-foreground font-normal">Configure when to switch between strategies</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {intervals.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <div className="font-medium text-foreground">No time intervals defined</div>
              <div className="text-sm text-muted-foreground">Add your first interval to create a timeline</div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {intervals.map((interval, index) => (
            <div key={interval.id} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-4 p-5 bg-gradient-accent border border-border/50 rounded-xl hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center gap-3 flex-1">
                  <div className="space-y-2 flex-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From (minutes)</Label>
                    <Input
                      type="number"
                      value={interval.startTime}
                      onChange={(e) => updateInterval(interval.id, "startTime", Number(e.target.value))}
                      className="h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To (minutes)</Label>
                    <Input
                      type="number"
                      value={interval.endTime}
                      onChange={(e) => updateInterval(interval.id, "endTime", Number(e.target.value))}
                      className="h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Strategy</Label>
                    <Select
                      value={interval.strategy}
                      onValueChange={(value) => updateInterval(interval.id, "strategy", value)}
                    >
                      <SelectTrigger className="h-10 bg-background/50 border-border/50 focus:border-primary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TWAP">TWAP</SelectItem>
                        <SelectItem value="RANGE_LIMIT">Range Limit</SelectItem>
                        <SelectItem value="DUTCH_AUCTION">Dutch Auction</SelectItem>
                        <SelectItem value="PRENEGOTIATED">Prenegotiated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeInterval(interval.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={addInterval}
          className="w-full border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 h-12 text-primary hover:text-primary transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Time Interval
        </Button>

        {/* Timeline visualization */}
        {intervals.length > 0 && (
          <div className="bg-gradient-accent border border-border/50 p-6 rounded-xl shadow-inner">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <div className="text-sm font-semibold text-foreground">Timeline Preview</div>
            </div>
            <div className="space-y-4">
              {intervals
                .sort((a, b) => a.startTime - b.startTime)
                .map((interval, index) => (
                  <div key={interval.id} className="group">
                    <div className="flex items-center gap-4">
                      <div className="w-24 text-xs text-muted-foreground font-mono bg-background/50 px-2 py-1 rounded">
                        {interval.startTime}-{interval.endTime}min
                      </div>
                      <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-primary rounded-full w-full group-hover:scale-105 transition-transform duration-300 shadow-glow"></div>
                      </div>
                      <div className="text-xs font-medium text-foreground bg-primary/10 px-2 py-1 rounded-md">
                        {getStrategyLabel(interval.strategy)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};