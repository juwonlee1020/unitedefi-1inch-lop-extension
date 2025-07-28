import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, TrendingUp } from "lucide-react";

interface TransitionTypeSelectorProps {
  selected: "time" | "price";
  onSelect: (type: "time" | "price") => void;
}

export const TransitionTypeSelector = ({ selected, onSelect }: TransitionTypeSelectorProps) => {
  return (
    <Card className="p-6 bg-gradient-secondary border-none">
      <h2 className="text-lg font-semibold mb-4 text-foreground">
        Choose Transition Type
      </h2>
      <div className="flex gap-3">
        <Button
          variant={selected === "time" ? "default" : "outline"}
          onClick={() => onSelect("time")}
          className="flex items-center gap-2 flex-1"
        >
          <Clock className="w-4 h-4" />
          Time-based
        </Button>
        <Button
          variant={selected === "price" ? "default" : "outline"}
          onClick={() => onSelect("price")}
          className="flex items-center gap-2 flex-1"
        >
          <TrendingUp className="w-4 h-4" />
          Price-based
        </Button>
      </div>
    </Card>
  );
};