import type { CalendarResourceId } from "../../data/calendar/calendarPricing";
import { calendarResourcePricing } from "../../data/calendar/calendarPricing";
import { formatYmdLocal } from "../calendar/calendarHolidayUtils";

/** 星期五、星期六（入住夜）→ 假日價；週日～週四 → 平日價 */
export function isFridayOrSaturdayLocal(y: number, m: number, d: number): boolean {
  const dow = new Date(y, m, d).getDay();
  return dow === 5 || dow === 6;
}

/**
 * 是否套用「假日價」：
 * 1) 在連假 override 日曆內，或
 * 2) 週五、週六入住夜
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

export function formatDiscountPriceDisplay(original: number, discount: number): string {
  return (
    "<del>" +
    formatPriceNt(original) +
    "</del> <strong>打卡優惠價 " +
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
 * 3) 未預訂 → 依連假 / 週末規則決定價格
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
  const holidayNight = isHolidayPriceNight(y, m, d, holidayOverrideSet);
  const amount = holidayNight ? cfg.weekend : cfg.weekday;
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

const RELEVANT = new Set(["balloon", "cloud", "rv"]);

/** 今日 0:00（本地） */
export function startOfToday(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function eventOverlapsLocalDay(ev: ParsedEventLike, y: number, m: number, day: number): boolean {
  const dayStart = new Date(y, m, day, 0, 0, 0, 0);
  const dayEnd = new Date(y, m, day + 1, 0, 0, 0, 0);
  return ev.end > dayStart && ev.start < dayEnd;
}

/**
 * 月曆顯示範圍：從「當月」到「最後一個仍有未來預訂的月份」；
 * 若完全沒有未來預訂，只顯示當月。
 */
export function computeCalendarMonthRange(
  events: ParsedEventLike[],
  now: Date = new Date()
): { startYm: { y: number; m: number }; endYm: { y: number; m: number } } {
  const todayStart = startOfToday(now);
  const startYm = { y: now.getFullYear(), m: now.getMonth() };
  let maxY = startYm.y;
  let maxM = startYm.m;

  for (const ev of events) {
    if (!ev.tags.some((t) => RELEVANT.has(t))) continue;
    if (ev.end <= todayStart) continue;

    let cur = new Date(
      ev.start < todayStart ? todayStart.getTime() : ev.start.getTime()
    );
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 0, 0, 0, 0);

    while (cur < ev.end) {
      if (
        cur >= todayStart &&
        eventOverlapsLocalDay(ev, cur.getFullYear(), cur.getMonth(), cur.getDate())
      ) {
        const cy = cur.getFullYear();
        const cm = cur.getMonth();
        if (cy > maxY || (cy === maxY && cm > maxM)) {
          maxY = cy;
          maxM = cm;
        }
      }
      cur.setDate(cur.getDate() + 1);
    }
  }

  return { startYm, endYm: { y: maxY, m: maxM } };
}
