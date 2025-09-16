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
        default: "bg-gradient-to-r from-[var(--accent)] via-[var(--accent)] to-[var(--accent-secondary)] text-[var(--button-primary-text)] shadow-[var(--card-elevated-shadow)] hover:shadow-[var(--card-hover-shadow)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        destructive: "bg-[var(--danger)] text-white hover:bg-[#bf1f1f] focus-visible:ring-2 focus-visible:ring-[rgba(214,36,36,0.3)]",
        outline: "border border-[var(--surface-border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--card-hover-border)] hover:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        secondary: "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--card-hover-border)] hover:bg-[var(--accent-soft)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        soft: "bg-[var(--surface-muted)] text-[var(--foreground)] border border-[var(--surface-border)] shadow-[var(--card-base-shadow)] hover:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        ghost: "bg-transparent text-[var(--foreground-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline hover:text-[var(--accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
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
