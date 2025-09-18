"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/app/lib/utils";
import { ModernCard, type ModernCardProps } from "./modern-card";

type CellAlign = "left" | "right" | "center";

type ModernTableColumn<T> = {
  key: keyof T | string;
  header: string;
  align?: CellAlign;
  formatter?: (value: unknown, row: T) => React.ReactNode;
  widthClass?: string;
};

type ModernTableEmptyState = {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
};

type ModernTableProps<T> = Omit<ModernCardProps, "children"> & {
  data: T[];
  columns: ModernTableColumn<T>[];
  rowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  zebra?: boolean;
  isLoading?: boolean;
  emptyState?: ModernTableEmptyState;
  headerDescription?: string;
};

function ModernTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowKey,
  onRowClick,
  zebra = true,
  isLoading = false,
  emptyState,
  headerDescription,
  className,
  padding = "lg",
  tone = "surface",
  ...rest
}: ModernTableProps<T>) {
  const showEmpty = !isLoading && data.length === 0;

  return (
    <ModernCard padding={padding} tone={tone} className={cn("space-y-4 overflow-hidden", className)} hoverable={false} {...rest}>
      {headerDescription ? (
        <p className="text-sm leading-relaxed text-[var(--foreground-subtle)]">{headerDescription}</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface-muted)] text-[var(--foreground-muted)] uppercase tracking-[0.12em]">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold",
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center",
                    column.widthClass,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="align-top text-[var(--foreground)]">
            <AnimatePresence initial={false}>
              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="border-t border-[var(--surface-border)]">
                      {columns.map((column) => (
                        <td key={String(column.key)} className="px-4 py-3">
                          <div className="h-4 w-full animate-pulse rounded-full bg-[var(--surface-muted)]" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data.map((row, index) => {
                    const key = rowKey ? rowKey(row, index) : index;
                    const zebraClass = zebra && index % 2 === 1 ? "bg-[var(--surface-muted)]/60" : "bg-[var(--surface)]";

                    return (
                      <motion.tr
                        key={key}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={() => (onRowClick ? onRowClick(row) : undefined)}
                        className={cn(
                          "border-t border-[var(--surface-border)] transition-colors",
                          zebraClass,
                          onRowClick && "cursor-pointer hover:bg-[var(--accent-soft)]",
                        )}
                      >
                        {columns.map((column) => {
                          const rawValue = (row as Record<string, unknown>)[column.key as string];
                          const content = column.formatter ? column.formatter(rawValue, row) : (rawValue as React.ReactNode);
                          return (
                            <td
                              key={String(column.key)}
                              className={cn(
                                "px-4 py-3 text-sm leading-relaxed",
                                column.align === "right" && "text-right",
                                column.align === "center" && "text-center",
                              )}
                            >
                              {content}
                            </td>
                          );
                        })}
                      </motion.tr>
                    );
                  })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {showEmpty && emptyState ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--surface-border)] bg-[var(--surface-muted)]/60 p-8 text-center">
          {emptyState.icon ? <div className="text-2xl text-[var(--accent)]">{emptyState.icon}</div> : null}
          <h4 className="text-lg font-semibold text-[var(--foreground)]">{emptyState.title}</h4>
          <p className="text-sm text-[var(--foreground-muted)] max-w-md">{emptyState.message}</p>
          {emptyState.action ? <div>{emptyState.action}</div> : null}
        </div>
      ) : null}
    </ModernCard>
  );
}

export type { CellAlign, ModernTableColumn, ModernTableEmptyState, ModernTableProps };
export { ModernTable };
