const targets = [
  ["露營車檔期頁", "https://van.joyforest.tw/pages/availability", "text/html"],
  ["露營車檔期 API", "https://van.joyforest.tw/api/campervan-availability", "application/json"],
  ["露營區檔期頁", "https://camp.8-ways.com/pages/availability", "text/html"],
  ["露營區檔期 API", "https://camp.8-ways.com/api/public-calendar", "text/calendar"]
];

const results = await Promise.all(targets.map(async ([name, url, expectedType]) => {
  const response = await fetch(url, { cache: "no-store" });
  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();
  let valid = response.ok && contentType.includes(expectedType);

  if (url.includes("campervan-availability")) {
    try {
      const data = JSON.parse(body);
      valid = valid && Array.isArray(data?.bookedDates) && Array.isArray(data?.waitlistDates);
    } catch {
      valid = false;
    }
  } else if (url.includes("public-calendar")) {
    valid = valid && body.includes("BEGIN:VCALENDAR") && body.includes("X-JOYFOREST-PUBLIC:1");
  }

  return { name, status: response.status, valid };
}));

for (const result of results) {
  console.log(`${result.valid ? "OK" : "FAIL"} ${result.name} HTTP ${result.status}`);
}

if (results.some((result) => !result.valid)) process.exitCode = 1;
