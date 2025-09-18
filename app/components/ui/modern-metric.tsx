"use client";

import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";
import { ModernCard, type ModernCardProps } from "./modern-card";

type MetricAccent = "accent" | "info" | "warning" | "danger" | "neutral";
type MetricTrendDirection = "up" | "down" | "neutral";

type MetricTrend = {
  value: string;
  direction?: MetricTrendDirection;
  label?: string;
  icon?: React.ReactNode;
};

type ModernMetricProps = Omit<ModernCardProps, "title" | "subtitle" | "eyebrow"> & {
  label: string;
  value: string | number;
  helper?: string;
  secondary?: string;
  icon?: React.ReactNode;
  accent?: MetricAccent;
  trend?: MetricTrend;
};

const accentTokens: Record<MetricAccent, { capsule: string; accent: string }> = {
  accent: {
    capsule: "bg-[var(--accent-soft)] text-[var(--accent)]",
    accent: "text-[var(--accent)]",
  },
  info: {
    capsule: "bg-[var(--info-soft)] text-[var(--info)]",
    accent: "text-[var(--info)]",
  },
  warning: {
    capsule: "bg-[var(--warning-soft)] text-[var(--warning)]",
    accent: "text-[var(--warning)]",
  },
  danger: {
    capsule: "bg-[var(--danger-soft)] text-[var(--danger)]",
    accent: "text-[var(--danger)]",
  },
  neutral: {
    capsule: "bg-[var(--neutral-soft)] text-[var(--foreground-muted)]",
    accent: "text-[var(--foreground-muted)]",
  },
};

const trendIcons: Record<MetricTrendDirection, React.ReactElement> = {
  up: <ArrowUpRight className="h-4 w-4" aria-hidden />,
  down: <ArrowDownRight className="h-4 w-4" aria-hidden />,
  neutral: <Minus className="h-4 w-4" aria-hidden />,
};

const ModernMetric = React.forwardRef<HTMLDivElement, ModernMetricProps>(
  (
    {
      label,
      value,
      helper,
      secondary,
      icon,
      accent = "accent",
      trend,
      className,
      padding = "md",
      tone = "surface",
      ...rest
    },
    ref,
  ) => {
    const accentStyles = accentTokens[accent];
    const trendDirection = trend?.direction ?? "neutral";

    return (
      <ModernCard
        ref={ref}
        padding={padding}
        tone={tone}
        hoverable={false}
        className={cn("gap-4", className)}
        {...rest}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.28em]", accentStyles.capsule)}>
              {label}
            </span>
            <p className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">{value}</p>
            {secondary ? <p className="text-sm text-[var(--foreground-muted)]">{secondary}</p> : null}
          </div>
          {icon ? (
            <motion.span
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--neutral-soft)] text-xl"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {icon}
            </motion.span>
          ) : null}
        </div>

        {trend ? (
          <div className={cn("flex items-center gap-2 text-sm font-medium", accentStyles.accent)}>
            {trend.icon ?? trendIcons[trendDirection]}
            <span>{trend.value}</span>
            {trend.label ? <span className="text-xs text-[var(--foreground-subtle)]">{trend.label}</span> : null}
          </div>
        ) : null}

        {helper ? <p className="text-xs leading-relaxed text-[var(--foreground-subtle)]">{helper}</p> : null}
      </ModernCard>
    );
  },
);

ModernMetric.displayName = "ModernMetric";

export type { MetricAccent, MetricTrend, ModernMetricProps };
export { ModernMetric };
