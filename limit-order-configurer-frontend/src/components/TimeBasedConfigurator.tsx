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
  strategy: "TWAP" | "RANGE_LIMIT" | "DUTCH_AUCTION";
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
      default: return strategy;
    }
  };

  return (
    <Card className="w-full bg-card border border-border shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center border">
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          Time-based Strategy Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {intervals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No time intervals defined. Add an interval to get started.
          </div>
        )}

        {intervals.map((interval, index) => (
          <div key={interval.id} className="flex items-center gap-3 p-3 bg-gradient-secondary rounded-lg">
            <div className="flex items-center gap-2 flex-1">
              <div className="space-y-1 flex-1">
                <Label className="text-xs">From (minutes)</Label>
                <Input
                  type="number"
                  value={interval.startTime}
                  onChange={(e) => updateInterval(interval.id, "startTime", Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">To (minutes)</Label>
                <Input
                  type="number"
                  value={interval.endTime}
                  onChange={(e) => updateInterval(interval.id, "endTime", Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Strategy</Label>
                <Select
                  value={interval.strategy}
                  onValueChange={(value) => updateInterval(interval.id, "strategy", value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TWAP">TWAP</SelectItem>
                    <SelectItem value="RANGE_LIMIT">Range Limit</SelectItem>
                    <SelectItem value="DUTCH_AUCTION">Dutch Auction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeInterval(interval.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addInterval}
          className="w-full border-dashed border-primary/50 hover:border-primary hover:bg-primary/5"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Time Interval
        </Button>

        {/* Timeline visualization */}
        {intervals.length > 0 && (
          <div className="bg-gradient-secondary p-4 rounded-lg">
            <div className="text-sm font-medium mb-3">Timeline Preview</div>
            <div className="space-y-2">
              {intervals
                .sort((a, b) => a.startTime - b.startTime)
                .map((interval, index) => (
                  <div key={interval.id} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-muted-foreground">
                      {interval.startTime}m - {interval.endTime}m
                    </div>
                    <div className="flex-1 h-2 bg-primary/20 rounded-full">
                      <div className="h-full bg-gradient-primary rounded-full w-full"></div>
                    </div>
                    <div className="text-xs font-medium">
                      {getStrategyLabel(interval.strategy)}
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