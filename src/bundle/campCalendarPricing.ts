/**
 * 瀏覽器 IIFE 入口：產出 assets/js/camp-calendar-pricing.js，供 calendar-availability.js 使用。
 */
import type { CalendarResourceId } from "../data/calendar/calendarPricing";
import { calendarHolidayBlocks2026 } from "../data/calendar/calendarHolidayBlocks2026";
import { calendarHolidayBlocks2027 } from "../data/calendar/calendarHolidayBlocks2027";
import { buildHolidayOverrideDateSet } from "../lib/calendar/calendarHolidayUtils";
import {
  computeCalendarMonthRange,
  resolveResourceRowDisplay as resolveResourceRowDisplayCore,
} from "../lib/date/datePricingUtils";

const holidayOverrideDateSet = buildHolidayOverrideDateSet(
  calendarHolidayBlocks2026,
  calendarHolidayBlocks2027
);

const CampCalendarPricing = {
  RESOURCE_ORDER: ["balloon", "cloud", "rv"] as const,
  holidayOverrideDateSet,
  computeCalendarMonthRange,
  resolveResourceRowDisplay(
    resourceId: string,
    y: number,
    m: number,
    d: number,
    isBooked: boolean
  ) {
    return resolveResourceRowDisplayCore(
      resourceId as CalendarResourceId,
      y,
      m,
      d,
      isBooked,
      holidayOverrideDateSet
    );
  },
};

window.CampCalendarPricing = CampCalendarPricing;
