import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  tooltip: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
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
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 focus:border-primary/50 hover:border-primary/30"
      />
    </div>
  );
};