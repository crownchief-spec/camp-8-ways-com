/**
 * 連假區間 → 價格套用日（入住夜）：整段往前移一天，天數不變。
 */

function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

/** 本地午夜，避免 UTC 偏移 */
export function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function formatYmdLocal(d: Date): string {
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

/** 本地日期的隔天（複製後加一天） */
export function addLocalDays(base: Date, delta: number): Date {
  const x = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
  x.setDate(x.getDate() + delta);
  return x;
}

/**
 * 單一官方連假區間 → 價格 override：整段往前移一天（起、迄各減一日），天數不變，展開區間內每一天（含首尾）。
 */
export function holidayBlockToPriceOverrideDates(block: {
  start: string;
  end: string;
}): string[] {
  const rawStart = parseYmdLocal(block.start);
  const rawEnd = parseYmdLocal(block.end);
  const priceStart = addLocalDays(rawStart, -1);
  const priceEnd = addLocalDays(rawEnd, -1);
  return enumerateInclusiveLocalYmd(priceStart, priceEnd);
}

function enumerateInclusiveLocalYmd(start: Date, end: Date): string[] {
  const out: string[] = [];
  if (start > end) return out;
  for (let cur = new Date(start); cur <= end; cur = addLocalDays(cur, 1)) {
    out.push(formatYmdLocal(cur));
    if (out.length > 400) break;
  }
  return out;
}

export function holidayBlocksToSortedUniqueYmds(
  blocks: Array<{ start: string; end: string }>
): string[] {
  const set = new Set<string>();
  for (const b of blocks) {
    for (const ymd of holidayBlockToPriceOverrideDates(b)) {
      set.add(ymd);
    }
  }
  return [...set].sort();
}

export function buildHolidayOverrideDateSet(
  blocks2026: Array<{ start: string; end: string }>,
  blocks2027: Array<{ start: string; end: string }>
): Set<string> {
  const s = new Set<string>();
  holidayBlocksToSortedUniqueYmds(blocks2026).forEach((x) => s.add(x));
  holidayBlocksToSortedUniqueYmds(blocks2027).forEach((x) => s.add(x));
  return s;
}

export function isYmdInHolidayOverrideSet(ymd: string, set: Set<string>): boolean {
  return set.has(ymd);
}
