"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-[#A4CBE1] bg-white px-3 py-2 text-sm text-[#00263E]",
          "placeholder:text-[#6B7C8C]/80 focus:outline-none focus:border-[#6FACDE] focus:ring-2 focus:ring-[#A4CBE1]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

