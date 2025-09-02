"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@components/ui/dropdown-menu";
import { ChevronDown, Check, Search } from "lucide-react";

export type SoftDropdownItem = {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
};

export interface SoftDropdownProps {
  items: SoftDropdownItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  searchable?: boolean;
}

export const SoftDropdown: React.FC<SoftDropdownProps> = ({
  items,
  selectedId,
  onSelect,
  placeholder = "Select",
  label,
  className,
  searchable = true,
}) => {
  const selected = items.find((i) => i.id === selectedId);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "btn-perf inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-900",
            "hover:bg-gray-200/90 active:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
            className
          )}
          aria-label={label || placeholder}
        >
          {selected?.icon}
          <span className="truncate max-w-[12rem] text-left">
            {selected?.label || placeholder}
          </span>
          <ChevronDown className="ml-1 size-4 text-gray-600" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="rounded-xl border-gray-200 bg-white p-0 shadow-lg">
        {label && (
          <DropdownMenuLabel className="px-3 py-2 text-gray-700">{label}</DropdownMenuLabel>
        )}
        {searchable && (
          <div className="px-3 pb-2 pt-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 size-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          </div>
        )}
        <DropdownMenuSeparator className="bg-gray-100" />
        <div className="max-h-64 w-64 overflow-auto py-1">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">No results</div>
          )}
          {filtered.map((item) => {
            const active = item.id === selectedId;
            return (
              <DropdownMenuItem
                key={item.id}
                onSelect={(e) => {
                  e.preventDefault();
                  onSelect?.(item.id);
                  setOpen(false);
                }}
                className={cn(
                  "mx-1 rounded-lg px-2 py-2 text-gray-900 hover:bg-gray-100",
                  active && "bg-gray-100"
                )}
              >
                {item.icon && <span className="mr-2 inline-flex items-center">{item.icon}</span>}
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.label}</div>
                    {item.description && (
                      <div className="truncate text-xs text-gray-500">{item.description}</div>
                    )}
                  </div>
                  {active && <Check className="size-4 shrink-0 text-gray-700" />}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SoftDropdown;

