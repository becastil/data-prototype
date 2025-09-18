"use client";

import React from "react";
import { cn } from "@/app/lib/utils";

type ModernButtonVariant = "primary" | "secondary" | "ghost";
type ModernButtonSize = "sm" | "md" | "lg";

type ModernButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ModernButtonVariant;
  size?: ModernButtonSize;
  asChild?: boolean;
};

const variantClasses: Record<ModernButtonVariant, string> = {
  primary: "bg-[var(--accent)] text-[var(--button-primary-text)] shadow-subtle hover:bg-[var(--accent-hover)]",
  secondary: "bg-[var(--surface-muted)] text-[var(--foreground)] hover:bg-[var(--surface)]",
  ghost: "bg-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--neutral-soft)]",
};

const sizeClasses: Record<ModernButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ variant = "primary", size = "md", className, type = "button", ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-transform duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-soft)]",
        variantClasses[variant],
        sizeClasses[size],
        "hover:-translate-y-0.5 active:translate-y-0",
        className,
      )}
      {...rest}
    />
  ),
);

ModernButton.displayName = "ModernButton";

export type { ModernButtonProps, ModernButtonVariant, ModernButtonSize };
export { ModernButton };
