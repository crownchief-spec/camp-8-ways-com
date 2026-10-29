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
  assert.equal(report.sourceRevenueTotals.direct.cases, 43);
  assert.equal(report.sourceRevenueTotals.direct.revenue, 298730);
});

test("monthly revenue is complete and adds up to the reconciled total", () => {
  assert.equal(report.monthlyRevenue.length, 13);
  assert.equal(report.monthlyRevenue[0].month, "2026-02");
  assert.equal(report.monthlyRevenue.at(-1).month, "2027-02");
  const actualRows = report.monthlyRevenue.filter((row) => !row.future);
  const total = actualRows.reduce((sum, row) => sum + row.revised, 0);
  assert.ok(Math.abs(total - 711932.47) < 0.001);
  assert.equal(actualRows.at(-1).cumulative, 711932.47);
});

test("all paid cases have a known source and barter is excluded", () => {
  const actualRows = report.monthlySourceCases.filter((row) => !row.future);
  const cases = actualRows.reduce((sum, row) => sum + row.total, 0);
  const unknown = actualRows.reduce((sum, row) => sum + row.unknown, 0);
  assert.equal(cases, 136);
  assert.equal(unknown, 0);
  assert.match(report.accountingBasis, /互惠為零/);
});

test("future booked revenue is separated from actual revenue", () => {
  assert.equal(report.futureTotals.airbnbCases, 4);
  assert.equal(report.futureTotals.agodaCases, 1);
  assert.equal(report.futureTotals.directCases, 2);
  assert.equal(report.futureTotals.direct, 19600);
  assert.equal(report.futureTotals.total, 40905.31);
  const november = report.monthlySourceCases.find((row) => row.month === "2026-11");
  assert.deepEqual(
    { airbnb: november.airbnb, agoda: november.agoda, direct: november.direct, future: november.future },
    { airbnb: 3, agoda: 1, direct: 0, future: true }
  );
  assert.equal(report.monthlySourceCases.find((row) => row.month === "2027-02").total, 0);
});
