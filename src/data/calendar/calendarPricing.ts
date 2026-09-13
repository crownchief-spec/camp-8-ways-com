/**
 * 查詢空房頁：各資源參考價格（單位：新台幣，未稅／總價依營主實際為準）
 * 修改價格請只改此檔。
 */
export type CalendarResourceId = "balloon" | "cloud" | "rv";

export interface PricedCalendarResource {
  /** 完整名稱（圖例、維運用） */
  label: string;
  /** 月曆格內簡稱 */
  shortLabel: string;
  /** 原價（僅供維運參考，空房頁不顯示） */
  originalPrice: number;
  /** 一般住宿日 */
  weekday: number;
  /** 一般週末住宿日 */
  weekend: number;
  /** 官方連假前 N−1 晚與每年 12/31 跨年夜 */
  longHoliday: number;
  showPrice: true;
}

export interface UnpricedCalendarResource {
  label: string;
  shortLabel: string;
  showPrice: false;
}

export const calendarResourcePricing: {
  balloon: PricedCalendarResource;
  cloud: PricedCalendarResource;
  rv: UnpricedCalendarResource;
} = {
  balloon: {
    label: "熱氣球房",
    shortLabel: "熱氣球",
    originalPrice: 7800,
    weekday: 5000,
    weekend: 5000,
    longHoliday: 6000,
    showPrice: true,
  },
  cloud: {
    label: "雲朵房",
    shortLabel: "雲朵",
    originalPrice: 7800,
    weekday: 5000,
    weekend: 5000,
    longHoliday: 6000,
    showPrice: true,
  },
  rv: {
    label: "露營車",
    shortLabel: "露營車",
    showPrice: false,
  },
};
