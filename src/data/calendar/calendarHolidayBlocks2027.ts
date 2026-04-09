/**
 * 2027 年官方辦公日曆／連假尚未公告。
 * 請之後手動補入 calendarHolidayBlocks2027 的 { start, end } 區間（YYYY-MM-DD），
 * 與 2026 年相同規則：程式會自動「整段往前移一天」產生假日價套用日。
 */
export const calendarHolidayBlocks2027: Array<{ start: string; end: string }> = [];
