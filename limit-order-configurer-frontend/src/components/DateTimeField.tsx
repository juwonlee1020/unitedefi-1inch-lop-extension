import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarIcon, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateTimeFieldProps {
  label: string;
  name: string;
  tooltip: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  required?: boolean;
}

export const DateTimeField: React.FC<DateTimeFieldProps> = ({
  label,
  name,
  tooltip,
  value,
  onChange,
  required = false,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label 
          htmlFor={name} 
          className="text-sm font-medium text-foreground flex items-center gap-2"
        >
          {label}
          {required && <span className="text-primary">*</span>}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 focus:border-primary/50 hover:border-primary/30",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP 'at' HH:mm") : "Select date and time"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};