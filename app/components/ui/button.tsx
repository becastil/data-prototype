"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/app/lib/utils";
import RiveLoader from "@components/loaders/RiveLoader";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gpu-accelerated btn-perf",
  {
    variants: {
      variant: {
        // Primary button per Gallagher
        default: "bg-gradient-to-r from-[#00E589] via-[#00E589] to-[#00C0FF] text-[#021015] shadow-[0_12px_30px_rgba(0,229,137,0.24)] hover:shadow-[0_18px_40px_rgba(0,229,137,0.32)] focus-visible:ring-2 focus-visible:ring-[rgba(0,229,137,0.45)]",
        destructive: "bg-[#FF5F5F] text-white hover:bg-[#ff3f3f] focus-visible:ring-2 focus-visible:ring-[rgba(255,95,95,0.3)]",
        outline: "border border-[rgba(255,255,255,0.18)] bg-[rgba(12,20,36,0.75)] text-[var(--foreground)] hover:border-[rgba(0,229,137,0.35)] hover:bg-[rgba(18,30,50,0.9)] focus-visible:ring-2 focus-visible:ring-[rgba(0,229,137,0.45)]",
        secondary: "bg-[rgba(0,229,137,0.12)] text-[var(--accent)] border border-[rgba(0,229,137,0.3)] hover:bg-[rgba(0,229,137,0.18)] focus-visible:ring-2 focus-visible:ring-[rgba(0,229,137,0.3)]",
        soft: "bg-[rgba(15,26,44,0.65)] text-[var(--foreground)] border border-[rgba(255,255,255,0.08)] shadow-sm hover:bg-[rgba(20,34,56,0.85)] active:bg-[rgba(18,30,50,0.9)] focus-visible:ring-2 focus-visible:ring-[rgba(0,229,137,0.35)]",
        ghost: "bg-transparent text-[var(--foreground-muted)] hover:bg-[rgba(0,229,137,0.12)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[rgba(0,229,137,0.45)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline hover:text-[var(--accent-hover)] focus-visible:ring-2 focus-visible:ring-[rgba(0,229,137,0.35)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    // When using asChild (Radix Slot), ensure exactly one child element.
    // Avoid adding loader as a sibling which would violate React.Children.only.
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as any}
        disabled={loading || (props as any).disabled}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <RiveLoader size="sm" />}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
