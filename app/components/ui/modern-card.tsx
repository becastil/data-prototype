"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";

type ModernCardTone = "surface" | "muted" | "elevated" | "translucent" | "accent";
type ModernCardPadding = "sm" | "md" | "lg";

type ModernCardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  tone?: ModernCardTone;
  padding?: ModernCardPadding;
  hoverable?: boolean;
  glow?: boolean;
};

const toneClasses: Record<ModernCardTone, string> = {
  surface: "bg-[var(--surface)]",
  muted: "bg-[var(--surface-muted)]",
  elevated: "bg-[var(--surface-elevated)]",
  translucent: "bg-white/80 dark:bg-white/10 backdrop-blur-xl",
  accent: "bg-[var(--accent-soft)]",
};

const paddingClasses: Record<ModernCardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  (
    {
      title,
      subtitle,
      eyebrow,
      icon,
      actions,
      tone = "surface",
      padding = "md",
      hoverable = true,
      glow = false,
      className,
      children,
      ...rest
    },
    ref,
  ) => (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverable ? { y: -4 } : undefined}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col gap-4 rounded-3xl border border-[var(--surface-border)] shadow-subtle transition-all duration-200",
        toneClasses[tone],
        paddingClasses[padding],
        hoverable && "hover:shadow-[var(--card-hover-shadow)]",
        hoverable && "hover:border-[var(--card-hover-border)]",
        glow && "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-br before:from-[var(--accent-glow)] before:to-transparent",
        className,
      )}
      {...rest}
    >
      {(eyebrow || title || subtitle || icon || actions) && (
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            {eyebrow ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--foreground-subtle)]">
                {eyebrow}
              </span>
            ) : null}
            {(title || icon) ? (
              <div className="flex items-center gap-2 text-[var(--foreground)]">
                {icon ? <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</span> : null}
                {title ? <h3 className="text-xl font-semibold tracking-tight">{title}</h3> : null}
              </div>
            ) : null}
            {subtitle ? <p className="max-w-prose text-sm leading-relaxed text-[var(--foreground-muted)]">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      )}
      {children}
    </motion.article>
  ),
);

ModernCard.displayName = "ModernCard";

export type { ModernCardProps, ModernCardTone, ModernCardPadding };
export { ModernCard };
