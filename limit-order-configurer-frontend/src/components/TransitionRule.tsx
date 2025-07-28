import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowDown, Clock, TrendingDown, X } from "lucide-react";

interface TransitionRuleProps {
  id: string;
  onRemove: (id: string) => void;
  onUpdate?: (id: string, data: any) => void;
}

export const TransitionRule = ({ id, onRemove, onUpdate }: TransitionRuleProps) => {
  const [conditionType, setConditionType] = useState<"time" | "price" | "">("");
  const [timeValue, setTimeValue] = useState("");
  const [timeUnit, setTimeUnit] = useState("minutes");
  const [priceValue, setPriceValue] = useState("");
  const [priceCondition, setPriceCondition] = useState("below");
  const [targetStrategy, setTargetStrategy] = useState("");

  const handleUpdate = () => {
    const data = {
      conditionType,
      timeValue,
      timeUnit,
      priceValue,
      priceCondition,
      targetStrategy,
    };
    onUpdate?.(id, data);
  };

  return (
    <Card className="p-4 bg-gradient-accent border border-primary/20 relative group">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(id)}
      >
        <X className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-2 mb-4">
        <ArrowDown className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Transition Rule</span>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Condition Type</Label>
          <Select value={conditionType} onValueChange={(value: "time" | "price") => {
            setConditionType(value);
            handleUpdate();
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select condition..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time-based
                </div>
              </SelectItem>
              <SelectItem value="price">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Price-based
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {conditionType === "time" && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Duration</Label>
              <Input
                type="number"
                placeholder="30"
                value={timeValue}
                onChange={(e) => {
                  setTimeValue(e.target.value);
                  handleUpdate();
                }}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unit</Label>
              <Select value={timeUnit} onValueChange={(value) => {
                setTimeUnit(value);
                handleUpdate();
              }}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {conditionType === "price" && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Condition</Label>
              <Select value={priceCondition} onValueChange={(value) => {
                setPriceCondition(value);
                handleUpdate();
              }}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="below">Below</SelectItem>
                  <SelectItem value="above">Above</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price</Label>
              <Input
                type="number"
                placeholder="3000"
                value={priceValue}
                onChange={(e) => {
                  setPriceValue(e.target.value);
                  handleUpdate();
                }}
                className="h-8"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs">Switch to Strategy</Label>
          <Select value={targetStrategy} onValueChange={(value) => {
            setTargetStrategy(value);
            handleUpdate();
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select target strategy..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="twap">TWAP Strategy</SelectItem>
              <SelectItem value="range">Range Limit Strategy</SelectItem>
              <SelectItem value="dutch">Dutch Auction Strategy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};