export type DateRangePreset = 'ALL' | '12M' | '6M' | '3M' | 'CUSTOM';

export interface DateRangeSelection {
  preset: DateRangePreset;
  start?: string; // YYYY-MM
  end?: string;   // YYYY-MM
}

// Try to normalize a month label into YYYY-MM; falls back to input
export const normalizeMonthKey = (label: string): string => {
  if (!label) return '';
  const s = String(label).trim();

  // Already YYYY-MM
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  // YYYY/MM -> YYYY-MM
  if (/^\d{4}\/\d{1,2}$/.test(s)) {
    const [y, m] = s.split('/');
    return `${y}-${String(Number(m)).padStart(2, '0')}`;
  }
  // MM/YYYY -> YYYY-MM
  if (/^\d{1,2}\/\d{4}$/.test(s)) {
    const [m, y] = s.split('/');
    return `${y}-${String(Number(m)).padStart(2, '0')}`;
  }
  // Mon YYYY or Month YYYY
  const tryDate = Date.parse(s.replace(/-/g, ' '));
  if (!isNaN(tryDate)) {
    const d = new Date(tryDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }
  return s; // fallback
};

// Filter rows by month range (inclusive) using a months timeline list for fallback
export const filterRowsByRange = (
  rows: any[],
  monthsTimeline: string[], // ordered labels as appear in data
  range: DateRangeSelection
): any[] => {
  if (!rows || rows.length === 0) return rows;
  if (range.preset === 'ALL') return rows;

  if (range.preset === '12M') return rows.slice(-12);
  if (range.preset === '6M') return rows.slice(-6);
  if (range.preset === '3M') return rows.slice(-3);

  // Custom range by YYYY-MM keys
  const labels = monthsTimeline.map(normalizeMonthKey);
  const startKey = normalizeMonthKey(range.start || '');
  const endKey = normalizeMonthKey(range.end || '');

  // Try index-based fallback if keys not found
  const startIdx = startKey ? labels.findIndex(l => l === startKey) : 0;
  const endIdx = endKey ? labels.findIndex(l => l === endKey) : labels.length - 1;

  const from = startIdx === -1 ? 0 : startIdx;
  const to = endIdx === -1 ? labels.length - 1 : endIdx;

  const [minIdx, maxIdx] = from <= to ? [from, to] : [to, from];
  return rows.slice(minIdx, maxIdx + 1);
};

