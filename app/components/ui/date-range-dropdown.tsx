"use client";

import * as React from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@components/ui/dropdown-menu";
import { cn } from "@/app/lib/utils";
import { CalendarDays, ChevronDown } from "lucide-react";
import { DateRangeSelection, DateRangePreset, normalizeMonthKey } from "@/app/utils/dateRange";

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: "All", value: "ALL" },
  { label: "Last 12M", value: "12M" },
  { label: "Last 6M", value: "6M" },
  { label: "Last 3M", value: "3M" },
  { label: "Custom", value: "CUSTOM" },
];

interface DateRangeDropdownProps {
  months: string[]; // ordered month labels from data
  value: DateRangeSelection;
  onChange: (next: DateRangeSelection) => void;
  className?: string;
}

export const DateRangeDropdown: React.FC<DateRangeDropdownProps> = ({ months, value, onChange, className }) => {
  const [open, setOpen] = React.useState(false);
  const first = months[0] || '';
  const last = months[months.length - 1] || '';
  const [start, setStart] = React.useState<string>(value.start || normalizeMonthKey(first));
  const [end, setEnd] = React.useState<string>(value.end || normalizeMonthKey(last));

  React.useEffect(() => {
    if (value.preset !== 'CUSTOM') return;
    setStart(value.start || normalizeMonthKey(first));
    setEnd(value.end || normalizeMonthKey(last));
  }, [value, first, last]);

  const currentLabel = () => {
    const preset = PRESETS.find(p => p.value === value.preset)?.label || 'Custom';
    if (value.preset === 'CUSTOM' && start && end) {
      return `${start} → ${end}`;
    }
    return preset;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "btn-perf inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black",
            "hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
            className
          )}
          aria-label="Date range"
        >
          <CalendarDays className="size-4 text-gray-700" />
          <span>{currentLabel()}</span>
          <ChevronDown className="ml-1 size-4 text-gray-600" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="rounded-xl border-gray-200 bg-white p-0 shadow-lg">
        <DropdownMenuLabel className="px-3 py-2 text-gray-700">Date Range</DropdownMenuLabel>
        <div className="px-2 pb-2">
          <div className="grid grid-cols-5 gap-2">
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => {
                  onChange({ preset: p.value });
                  if (p.value !== 'CUSTOM') setOpen(false);
                }}
                className={cn(
                  "col-span-1 rounded-lg px-2 py-1.5 text-xs font-medium border",
                  value.preset === p.value ? "bg-black text-white border-black" : "bg-white text-black border-gray-300 hover:bg-gray-50"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <DropdownMenuSeparator className="bg-gray-100" />
        {/* Custom range section */}
        <div className={cn("px-3 py-3 space-y-2", value.preset === 'CUSTOM' ? '' : 'opacity-50 pointer-events-none')}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start</label>
              <input
                type="month"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End</label>
              <input
                type="month"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                onChange({ preset: 'CUSTOM', start, end });
                setOpen(false);
              }}
              className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 border border-black"
            >
              Apply
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DateRangeDropdown;

