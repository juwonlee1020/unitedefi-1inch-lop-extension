import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, TrendingUp } from "lucide-react";

interface TransitionTypeSelectorProps {
  selected: "time" | "price";
  onSelect: (type: "time" | "price") => void;
}

export const TransitionTypeSelector = ({ selected, onSelect }: TransitionTypeSelectorProps) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-primary opacity-5 rounded-2xl blur-xl"></div>
      <div className="relative bg-gradient-glass backdrop-blur-xl border border-border/50 rounded-2xl shadow-glass overflow-hidden">
        <div className="p-10">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-2xl font-semibold text-foreground font-inter">
              Choose Your Transition Logic
            </h2>
            <p className="text-muted-foreground font-inter font-light">
              Select how your strategy will intelligently transition between execution methods
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => onSelect("time")}
              className={`group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 ${
                selected === "time"
                  ? "bg-gradient-primary shadow-pink-soft scale-[1.02]"
                  : "bg-gradient-glass border border-border/50 hover:border-primary/30 hover:shadow-medium hover:scale-[1.01]"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative space-y-4">
                <div className={`p-4 rounded-xl transition-colors duration-200 ${
                  selected === "time" 
                    ? "bg-white/20" 
                    : "bg-primary/10 group-hover:bg-primary/20"
                }`}>
                  <Clock className={`w-8 h-8 ${selected === "time" ? "text-white" : "text-primary"}`} />
                </div>
                <div className="space-y-2">
                  <h3 className={`text-lg font-semibold font-inter ${
                    selected === "time" ? "text-white" : "text-foreground"
                  }`}>
                    Time-based Transitions
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    selected === "time" ? "text-white/80" : "text-muted-foreground"
                  }`}>
                    Execute different strategies at predetermined time intervals with precise scheduling control
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelect("price")}
              className={`group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 ${
                selected === "price"
                  ? "bg-gradient-primary shadow-pink-soft scale-[1.02]"
                  : "bg-gradient-glass border border-border/50 hover:border-primary/30 hover:shadow-medium hover:scale-[1.01]"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative space-y-4">
                <div className={`p-4 rounded-xl transition-colors duration-200 ${
                  selected === "price" 
                    ? "bg-white/20" 
                    : "bg-primary/10 group-hover:bg-primary/20"
                }`}>
                  <TrendingUp className={`w-8 h-8 ${selected === "price" ? "text-white" : "text-primary"}`} />
                </div>
                <div className="space-y-2">
                  <h3 className={`text-lg font-semibold font-inter ${
                    selected === "price" ? "text-white" : "text-foreground"
                  }`}>
                    Price-based Transitions
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    selected === "price" ? "text-white/80" : "text-muted-foreground"
                  }`}>
                    Adapt strategies dynamically based on real-time market price movements and ranges
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};