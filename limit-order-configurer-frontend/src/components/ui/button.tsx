import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-inter",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground hover:shadow-pink-soft hover:scale-[1.02] active:scale-[0.98] font-medium shadow-medium",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-2 border-primary/30 bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary hover:shadow-soft active:scale-[0.98]",
        secondary:
          "bg-gradient-secondary text-secondary-foreground hover:bg-gradient-accent hover:scale-[1.01] shadow-soft active:scale-[0.99]",
        ghost: "hover:bg-primary/10 hover:text-primary active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        cta: "bg-gradient-primary text-primary-foreground hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98] font-semibold text-base px-12 py-4 rounded-2xl shadow-large relative overflow-hidden",
        glass: "bg-gradient-glass border border-border/50 backdrop-blur-md hover:border-primary/30 hover:shadow-glass active:scale-[0.98] text-foreground shadow-medium",
        wallet: "bg-gradient-primary text-primary-foreground hover:shadow-pink-soft hover:scale-105 font-semibold shadow-medium",
        strategy: "bg-gradient-glass border border-border/50 backdrop-blur-md hover:border-primary/30 hover:shadow-glass active:scale-[0.98] text-foreground shadow-medium",
      },
      size: {
        default: "h-11 px-6 py-2.5 rounded-xl",
        sm: "h-9 rounded-lg px-4 text-xs font-medium",
        lg: "h-12 rounded-xl px-8 text-base font-medium",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
