import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const context = { window: {} };
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(new URL("../assets/js/camp-calendar-pricing.js", import.meta.url), "utf8"),
  context
);

const pricing = context.window.CampCalendarPricing;

function displayedPrice(room, ymd) {
  const [year, month, day] = ymd.split("-").map(Number);
  const display = pricing.resolveResourceRowDisplay(room, year, month - 1, day, false);
  const match = display.formattedPrice.match(/\$([\d,]+)/);
  return match ? Number(match[1].replace(/,/g, "")) : null;
}

test("2027 官方連假依各房型價格，春節指定期間優先", () => {
  const holidayNights = [
    "2027-01-01", "2027-01-02",
    "2027-02-04", "2027-02-05", "2027-02-06", "2027-02-07", "2027-02-08", "2027-02-09",
    "2027-02-27", "2027-02-28",
    "2027-04-03", "2027-04-04", "2027-04-05",
    "2027-04-30", "2027-05-01",
    "2027-10-09", "2027-10-10",
    "2027-10-23", "2027-10-24",
    "2027-12-24", "2027-12-25",
    "2027-12-31", "2028-01-01"
  ];

  for (const ymd of holidayNights) {
    assert.equal(displayedPrice("balloon", ymd), 7800, `${ymd} 熱氣球房`);
    const cloudPrice = ymd >= "2027-02-04" && ymd <= "2027-02-10" ? 7800 : 6800;
    assert.equal(displayedPrice("cloud", ymd), cloudPrice, `${ymd} 雲朵房`);
  }
});

test("官方連假最後一天回到各房型一般價格", () => {
  const finalDates = [
    "2027-01-03", "2027-02-11", "2027-03-01", "2027-04-06", "2027-05-02",
    "2027-10-11", "2027-10-25", "2027-12-26", "2028-01-02"
  ];

  for (const ymd of finalDates) {
    assert.equal(displayedPrice("balloon", ymd), 5800, `${ymd} 熱氣球房`);
    assert.equal(displayedPrice("cloud", ymd), 5000, `${ymd} 雲朵房`);
  }
});

test("春節前夕 2027-02-03 維持各房型原有連假價格", () => {
  assert.equal(displayedPrice("balloon", "2027-02-03"), 7800);
  assert.equal(displayedPrice("cloud", "2027-02-03"), 6800);
});

test("2027 春節 2/4～2/10 每晚兩房均為 7,800 元，已預訂優先", () => {
  for (let day = 4; day <= 10; day++) {
    const ymd = `2027-02-${String(day).padStart(2, "0")}`;
    for (const room of ["balloon", "cloud"]) {
      assert.equal(displayedPrice(room, ymd), 7800, `${ymd} ${room}`);
      const booked = pricing.resolveResourceRowDisplay(room, 2027, 1, day, true);
      assert.equal(booked.kind, "booked", `${ymd} ${room} 已預訂`);
      assert.equal("formattedPrice" in booked, false);
    }
    assert.equal(pricing.resolveResourceRowDisplay("rv", 2027, 1, day, false).kind, "hidden");
  }
});
