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
        default: "bg-[#6FACDE] text-[#00263E] hover:brightness-90 focus-visible:ring-2 focus-visible:ring-[#A4CBE1]",
        destructive: "bg-red-500 text-red-50 hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-[#A4CBE1]",
        // Secondary outline per Gallagher
        outline: "border border-[#6FACDE] bg-transparent text-[#00263E] hover:bg-[#F4F8FC] focus-visible:ring-2 focus-visible:ring-[#A4CBE1]",
        secondary: "bg-transparent text-[#00263E] border border-[#6FACDE] hover:bg-[#F4F8FC] focus-visible:ring-2 focus-visible:ring-[#A4CBE1]",
        soft: "bg-[#F4F8FC] text-[#00263E] border border-[#A4CBE1] shadow-sm hover:bg-[#F4F8FC] active:bg-[#F4F8FC] focus-visible:ring-2 focus-visible:ring-[#A4CBE1]",
        ghost: "bg-transparent text-[#00263E] hover:bg-[#F4F8FC] focus-visible:ring-2 focus-visible:ring-[#A4CBE1]",
        link: "text-[#00263E] underline-offset-4 hover:underline hover:text-[#2E4B66] focus-visible:ring-2 focus-visible:ring-[#A4CBE1]",
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
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <RiveLoader size="sm" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
