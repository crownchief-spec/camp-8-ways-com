/**
 * 查詢空房頁：各資源參考價格（單位：新台幣，未稅／總價依營主實際為準）
 * 修改價格請只改此檔。
 */
export type CalendarResourceId = "balloon" | "cloud" | "rv";

export interface PricedCalendarResource {
  label: string;
  /** 平日（週日～週四入住夜，且非連假 override） */
  weekday: number;
  /** 假日（週五～週六入住夜，或連假 override 日） */
  weekend: number;
  showPrice: true;
}

export interface UnpricedCalendarResource {
  label: string;
  showPrice: false;
}

export const calendarResourcePricing: {
  balloon: PricedCalendarResource;
  cloud: PricedCalendarResource;
  rv: UnpricedCalendarResource;
} = {
  balloon: {
    label: "熱氣球房",
    weekday: 3800,
    weekend: 5800,
    showPrice: true,
  },
  cloud: {
    label: "雲朵房",
    weekday: 3800,
    weekend: 4800,
    showPrice: true,
  },
  rv: {
    label: "露營車",
    showPrice: false,
  },
};
