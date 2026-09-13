import type { CalendarResourceId } from "../../data/calendar/calendarPricing";
import { calendarResourcePricing } from "../../data/calendar/calendarPricing";
import { calendarSpecialNightlyPrices } from "../../data/calendar/calendarSpecialNightlyPrices";
import { formatYmdLocal } from "../calendar/calendarHolidayUtils";

export const BOOKING_WINDOW_MONTHS = 6;

/** 星期五、星期六（入住夜）→ 假日價；週日～週四 → 平日價 */
export function isFridayOrSaturdayLocal(y: number, m: number, d: number): boolean {
  const dow = new Date(y, m, d).getDay();
  return dow === 5 || dow === 6;
}

/**
 * 是否為週末或連假住宿日（保留給其他顯示邏輯使用）。
 */
export function isHolidayPriceNight(
  y: number,
  m: number,
  d: number,
  holidayOverrideSet: Set<string>
): boolean {
  const key = formatYmdLocal(new Date(y, m, d, 0, 0, 0, 0));
  if (holidayOverrideSet.has(key)) return true;
  return isFridayOrSaturdayLocal(y, m, d);
}

export function formatPriceNt(amount: number): string {
  return "$" + amount.toLocaleString("zh-TW");
}

export function formatDiscountPriceDisplay(_original: number, discount: number): string {
  return (
    '<span class="availability-line__promo-label">打卡優惠</span> <strong>' +
    formatPriceNt(discount) +
    "</strong>"
  );
}

export type ResourceRowDisplay =
  | { kind: "booked"; label: string; shortLabel: string }
  | { kind: "price"; label: string; shortLabel: string; formattedPrice: string }
  | { kind: "hidden" };

/**
 * 單一資源、單一入住夜：
 * 1) 已預訂 → 已預訂
 * 2) 未預訂且 showPrice false → 不顯示列
 * 3) 未預訂 → 特殊日期優先，其次連假，最後才是一般價格
 */
export function resolveResourceRowDisplay(
  resourceId: CalendarResourceId,
  y: number,
  m: number,
  d: number,
  isBooked: boolean,
  holidayOverrideSet: Set<string>
): ResourceRowDisplay {
  const cfg = calendarResourcePricing[resourceId];
  if (isBooked) {
    return { kind: "booked", label: cfg.label, shortLabel: cfg.shortLabel };
  }
  if (!cfg.showPrice) {
    return { kind: "hidden" };
  }
  const key = formatYmdLocal(new Date(y, m, d, 0, 0, 0, 0));
  const specialPrice = calendarSpecialNightlyPrices[key];
  const amount =
    specialPrice ??
    (holidayOverrideSet.has(key)
      ? cfg.longHoliday
      : isFridayOrSaturdayLocal(y, m, d)
        ? cfg.weekend
        : cfg.weekday);
  return {
    kind: "price",
    label: cfg.label,
    shortLabel: cfg.shortLabel,
    formattedPrice: formatDiscountPriceDisplay(cfg.originalPrice, amount),
  };
}

export interface ParsedEventLike {
  start: Date;
  end: Date;
  tags: string[];
}

/** 今日 0:00（本地） */
export function startOfToday(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * 月曆顯示範圍：從當月到六個月後的同月份。
 * 實際可查詢／預訂的最後一天由 isWithinBookingWindow 控制。
 */
export function computeCalendarMonthRange(
  _events: ParsedEventLike[],
  now: Date = new Date()
): { startYm: { y: number; m: number }; endYm: { y: number; m: number } } {
  const startYm = { y: now.getFullYear(), m: now.getMonth() };
  const cutoff = bookingWindowCutoff(now);
  return { startYm, endYm: { y: cutoff.getFullYear(), m: cutoff.getMonth() } };
}

/** 今天起算六個月內（含截止當天）才顯示空房與價格。 */
export function bookingWindowCutoff(now: Date = new Date()): Date {
  const source = startOfToday(now);
  const targetMonth = new Date(
    source.getFullYear(),
    source.getMonth() + BOOKING_WINDOW_MONTHS,
    1
  );
  const lastDay = new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth() + 1,
    0
  ).getDate();
  return new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    Math.min(source.getDate(), lastDay),
    0,
    0,
    0,
    0
  );
}

export function isWithinBookingWindow(
  y: number,
  m: number,
  d: number,
  now: Date = new Date()
): boolean {
  const day = new Date(y, m, d, 0, 0, 0, 0);
  return day >= startOfToday(now) && day <= bookingWindowCutoff(now);
}
