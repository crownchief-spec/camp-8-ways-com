export {};

declare global {
  interface Window {
    CampCalendarPricing: {
      readonly RESOURCE_ORDER: readonly ["balloon", "cloud", "rv"];
      readonly holidayOverrideDateSet: Set<string>;
      computeCalendarMonthRange(
        events: Array<{ start: Date; end: Date; tags: string[] }>
      ): {
        startYm: { y: number; m: number };
        endYm: { y: number; m: number };
      };
      resolveResourceRowDisplay(
        resourceId: string,
        y: number,
        m: number,
        d: number,
        isBooked: boolean
      ):
        | { kind: "booked"; label: string; shortLabel: string }
        | { kind: "price"; label: string; shortLabel: string; formattedPrice: string }
        | { kind: "hidden" };
    };
  }
}
