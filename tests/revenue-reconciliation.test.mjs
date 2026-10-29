import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const report = JSON.parse(
  fs.readFileSync(new URL("../data/revenue-reconciliation-2026.json", import.meta.url), "utf8")
);

test("2026 revenue reconciliation has exact platform and direct totals", () => {
  assert.equal(report.updatedAt, "2026-10-29");
  assert.equal(report.platformTotals.airbnb.cases, 39);
  assert.equal(report.platformTotals.airbnb.net, 162452.47);
  assert.equal(report.platformTotals.agoda.cases, 54);
  assert.equal(report.platformTotals.agoda.net, 250750);
  assert.equal(report.sourceRevenueTotals.direct.cases, 58);
  assert.equal(report.sourceRevenueTotals.direct.revenue, 395570);
  assert.equal(report.calendarSource.exportedEvents, 278);
});

test("monthly revenue is complete and adds up to the reconciled total", () => {
  assert.equal(report.monthlyRevenue.length, 13);
  assert.equal(report.monthlyRevenue[0].month, "2026-02");
  assert.equal(report.monthlyRevenue.at(-1).month, "2027-02");
  const actualRows = report.monthlyRevenue.filter((row) => !row.future);
  const total = actualRows.reduce((sum, row) => sum + row.revised, 0);
  assert.ok(Math.abs(total - 808772.47) < 0.001);
  assert.equal(actualRows.at(-1).cumulative, 808772.47);
});

test("all paid cases have a known source and barter is excluded", () => {
  const actualRows = report.monthlySourceCases.filter((row) => !row.future);
  const cases = actualRows.reduce((sum, row) => sum + row.total, 0);
  const unknown = actualRows.reduce((sum, row) => sum + row.unknown, 0);
  assert.equal(cases, 151);
  assert.equal(unknown, 0);
  assert.match(report.accountingBasis, /互惠為零/);
});

test("future booked revenue is separated from actual revenue", () => {
  assert.equal(report.futureTotals.airbnbCases, 10);
  assert.equal(report.futureTotals.agodaCases, 4);
  assert.equal(report.futureTotals.directCases, 32);
  assert.equal(report.futureTotals.direct, 359780);
  assert.equal(report.futureTotals.total, 435908.62);
  assert.equal(report.futureTotals.tentativeCases, 3);
  assert.equal(report.futureTotals.tentativeRevenue, 23600);
  const november = report.monthlySourceCases.find((row) => row.month === "2026-11");
  assert.deepEqual(
    { airbnb: november.airbnb, agoda: november.agoda, direct: november.direct, future: november.future },
    { airbnb: 4, agoda: 3, direct: 12, future: true }
  );
  assert.deepEqual(
    report.monthlySourceCases.find((row) => row.month === "2027-02"),
    { month: "2027-02", total: 7, airbnb: 2, agoda: 0, direct: 5, unknown: 0, future: true, tentative: 1 }
  );
});

test("campervan revenue is reconciled separately from campground source ratios", () => {
  assert.equal(report.campervanTotals.cases, 11);
  assert.equal(report.campervanTotals.revenue, 190500);
  assert.equal(report.campervanTotals.unresolved, 2);
  assert.equal(report.campervanMonthlyRevenue.reduce((sum, row) => sum + row.revenue, 0), 190500);
  assert.equal(report.correctionSummary.difference, 96840);
});

test("virtual events preserve campervan stays and paid mixed-use venue income", () => {
  assert.equal(report.virtualEvents.length, 162);
  const campervanEvents = report.virtualEvents.filter((row) => row.roomTags.includes("rv"));
  assert.equal(campervanEvents.length, 11);
  assert.ok(campervanEvents.every((row) => row.nights >= 2));

  const carina = report.actualDirect.find((row) => row.summary.includes("Carina"));
  assert.ok(carina);
  assert.equal(carina.amount, 5800);
  assert.ok(!report.excludedEventIds.includes(carina.calendarUid));
});
