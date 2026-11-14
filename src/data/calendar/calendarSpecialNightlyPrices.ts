/**
 * 特殊日期直接預訂價；優先於一般日期與連假價格。
 * 目前沒有覆蓋價格；連假依各房型的 longHoliday 價格計算。
 */
export const calendarSpecialNightlyPrices: Readonly<Record<string, number>> = {};
