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
          "flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black",
          "placeholder:text-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-gray-200",
          "disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400",
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

