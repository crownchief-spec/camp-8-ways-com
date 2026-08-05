/**
 * 從 Google 行事曆內文解析實際收入金額。
 * 供 Cloudflare functions（ESM）與前台 admin-revenue 共用同一套規則。
 */

function normalizeMoneyToken(raw, minAmount = 1000) {
  if (raw == null) return null;
  const s = String(raw)
    .replace(/[,\s　]/g, "")
    .replace(/[元塊]/g, "");
  if (!/^\d+$/.test(s)) return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < minAmount || n > 5000000) return null;
  return n;
}

/** 將錢相關算式正規化成只含數字與 + * = */
function normalizeArithmeticSource(raw) {
  if (!raw) return "";
  let expr = String(raw)
    .replace(/\u2028|\u2029/g, " ")
    .replace(/（[^）]*）/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/NT\$?/gi, "")
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .replace(/[元塊]/g, "")
    .replace(/[×ｘ✕✖]/g, "*")
    .replace(/[xX](?=\d)/g, "*")
    .replace(/[＋]/g, "+")
    .replace(/一天/g, "+")
    .replace(/加時\s*/g, "+")
    .replace(/優惠/g, "")
    .replace(/\s+/g, "");

  expr = expr.replace(/[^\d+*=]/g, "");
  return expr;
}

/**
 * 計算如 11800+2*2800、8800*4、13800+2800+4800
 * 若有 = 則取右側數字。
 */
export function evaluateMoneyExpression(raw, minAmount = 1000) {
  if (!raw) return null;
  let expr = normalizeArithmeticSource(raw);
  if (!expr) return null;

  if (/=/.test(expr)) {
    const rhs = expr.split("=").pop().replace(/\*/g, "");
    return normalizeMoneyToken(rhs, minAmount);
  }

  if (!/^[\d+*]+$/.test(expr)) return null;
  if (/^[+*]/.test(expr) || /[+]{2,}|\*{2,}|[+*]$/.test(expr)) return null;

  const terms = expr.split("+");
  let sum = 0;
  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    if (!term) continue;
    const factors = term.split("*");
    let prod = 1;
    for (let j = 0; j < factors.length; j++) {
      const f = factors[j];
      if (!/^\d+$/.test(f)) return null;
      prod *= parseInt(f, 10);
    }
    sum += prod;
  }
  if (!Number.isFinite(sum) || sum < minAmount || sum > 5000000) return null;
  return sum;
}

function isChannelWithoutPrice(text, bookingSource) {
  return (
    bookingSource === "Airbnb" ||
    bookingSource === "Agoda" ||
    /airbnb/i.test(text || "") ||
    /agoda/i.test(text || "")
  );
}

function lineLooksLikeDepositOrBalance(line) {
  return /訂金|餘額|押金|Deposit|Balance|Payable|代付/.test(line);
}

function pickBestCandidate(candidates) {
  if (!candidates.length) return null;
  candidates.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return b.amount - a.amount;
  });
  return candidates[0].amount;
}

function takeContinuation(lines, index, rhs) {
  let out = (rhs || "").trim();
  if (out && /\d{4,}/.test(out.replace(/[,\s]/g, ""))) return out;
  if (out && /(?:NT\$?|\$)\s*[\d,]/.test(out)) return out;
  const next = (lines[index + 1] || "").trim();
  if (
    next &&
    /(?:NT\$?|\$|\d)/.test(next) &&
    !/預約人|姓名|電話|訂金|到府|地址|打卡|聯絡/.test(next)
  ) {
    return out ? out + " " + next : next;
  }
  return out;
}

/**
 * 從完整行事曆文字解析收入。
 * 優先：總租金／Total Rental → 租金算式 → 方案費用／總費用 → 費用 → 費用計算。
 */
export function parseStatedPriceFromText(text, bookingSource) {
  if (!text) return null;
  if (isChannelWithoutPrice(text, bookingSource)) return null;

  const candidates = [];
  const push = (amount, score) => {
    if (amount == null) return;
    candidates.push({ amount, score });
  };

  const lines = String(text).split(/\r?\n/);

  // 1) 明確「總租金」／Total Rental／New Total
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/收取總租金|總租金約|總租金的\s*\d/.test(line)) continue;

    const m =
      line.match(
        /(?:露營車)?\s*\d+\s*晚\s*總租金[：:]\s*(?:NT\$?\s*)?([\d,\s　]+)/i
      ) ||
      line.match(/總租金[：:]\s*(?:NT\$?\s*)?([\d,\s　]+)/i) ||
      line.match(/Total\s+Rental\s+Fee[：:]\s*NT\$?\s*([\d,\s]+)/i) ||
      line.match(/New\s+Total\s*\([^)]*\)[：:]\s*NT\$?\s*([\d,\s]+)/i) ||
      line.match(/Total\s+Rent(?:al)?[：:]\s*NT\$?\s*([\d,\s]+)/i);
    if (m) push(normalizeMoneyToken(m[1]), 100);
  }

  // 2) 「總費用12345」或「總費用：12345」
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (lineLooksLikeDepositOrBalance(line) && !/露營車/.test(line)) continue;
    const m = line.match(/總費用\s*[：:]?\s*(?:NT\$?\s*)?([\d,\s　]{3,})/i);
    if (m) {
      const n = normalizeMoneyToken(m[1], 3000);
      if (n && n >= 5000) push(n, 90);
      else if (n && /露營車|租金|方案/.test(line)) push(n, 85);
    }
  }

  // 3) 「…租金：算式」（金額可能在下一行）
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/超時|每小時/.test(line) && !/租金[：:]/.test(line)) continue;
    const m = line.match(/(?:總)?租金[：:]\s*(.*)$/i);
    if (!m) continue;
    const rhs = takeContinuation(lines, i, m[1]);
    if (!rhs || /^(平常日優惠|優惠)?$/i.test(rhs)) continue;

    const plainPref = rhs.match(/^([\d,\s]+)\s*優惠/);
    if (plainPref) {
      push(normalizeMoneyToken(plainPref[1]), 88);
      continue;
    }
    const prefNum = rhs.match(/優惠\s*([\d,\s]+)/);
    if (prefNum && !/[+＋×*]/.test(rhs)) {
      push(normalizeMoneyToken(prefNum[1]), 88);
      continue;
    }

    if (/費用是|增加時間/.test(rhs)) {
      const base = rhs.match(/(?:^|[^\d])(1[0-9]{4}|[5-9]\d{3})(?!\d)/);
      if (base) {
        let sum = parseInt(base[1], 10);
        const day = rhs.match(/一天\s*\$?\s*([\d,]+)/);
        if (day) sum += parseInt(day[1].replace(/,/g, ""), 10);
        const hours = rhs.match(/(\d+)\s*[×*]\s*\$?\s*(\d+)/);
        if (hours) sum += parseInt(hours[1], 10) * parseInt(hours[2], 10);
        if (sum >= 5000) push(sum, 87);
      } else {
        const ev = evaluateMoneyExpression(rhs, 1000);
        if (ev) push(ev, 86);
      }
      continue;
    }

    // 「六天五夜13800 +3×2800」
    if (/天|夜|小時/.test(rhs) && /\d{4,}/.test(rhs)) {
      const evDays = evaluateMoneyExpression(rhs, 100);
      if (evDays) {
        push(evDays, 91);
        continue;
      }
    }

    const evaluated = evaluateMoneyExpression(rhs, 100);
    if (evaluated && /[+＋×*=]/.test(rhs)) {
      push(evaluated, 92);
      continue;
    }
    const mainCash = rhs.match(/^(?:NT\$?|\$)?\s*([\d,\s]+)/i);
    if (mainCash) {
      const n = normalizeMoneyToken(mainCash[1]);
      if (n) push(n, 88);
    } else if (evaluated) {
      push(evaluated, 88);
    }
  }

  // 4) 方案費用：（金額可能在下一行）
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/方案費用[：:]\s*(.*)$/);
    if (!m) continue;
    const rhs = takeContinuation(lines, i, m[1]);
    if (!rhs) continue;
    if (
      /^(三天兩夜48小時|六天五夜|九天八夜|五天四夜|四天三夜)/.test(rhs) &&
      !/\d{4,}/.test(rhs.replace(/[,\s]/g, ""))
    ) {
      continue;
    }
    if (/=/.test(rhs)) {
      push(evaluateMoneyExpression(rhs), 84);
      continue;
    }
    const ev = evaluateMoneyExpression(rhs, 100);
    if (ev && /[+＋×*]/.test(rhs)) {
      push(ev, 84);
      continue;
    }
    const nested = rhs.match(/費用\s*([\d,\s]+)\s*元?/);
    if (nested) {
      push(normalizeMoneyToken(nested[1]), 83);
      continue;
    }
    const cash = rhs.match(/(?:NT\$?|\$)\s*([\d,\s]+)/i);
    if (cash) {
      if (/[+＋]/.test(rhs)) {
        const full = evaluateMoneyExpression(rhs, 100);
        if (full) {
          push(full, 84);
          continue;
        }
      }
      push(normalizeMoneyToken(cash[1]), 80);
      continue;
    }
    const plain = rhs.match(/(?:優惠)?\s*([\d,\s]{4,})/);
    if (plain) push(normalizeMoneyToken(plain[1]), 78);
  }

  // 5) 「（費用計算13800 +5× 2800）」
  const calcParen = text.match(/費用計算\s*([^）\n]+)/);
  if (calcParen) push(evaluateMoneyExpression(calcParen[1], 100), 82);

  // 6) 「費用13800」（無冒號）／「這樣子是13800」
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/訂金|超時|每小時|每晚/.test(line)) continue;
    const bare = line.match(/(?:^|[^\d])費用\s*(?:NT\$?|\$)?\s*([\d,\s]{4,})/);
    if (bare) push(normalizeMoneyToken(bare[1]), 75);
    const narrative = line.match(
      /(?:是|為|共|合計)\s*(?:NT\$?|\$)?\s*([\d,\s]{4,})\s*(?:元|塊)?/
    );
    if (narrative && /費用|租金|三天|兩夜|方案/.test(line)) {
      push(normalizeMoneyToken(narrative[1]), 74);
    }
  }

  // 7) 一般「費用：」（略過超時費用、營地每晚價）
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/超時費用|加時費/.test(line)) continue;
    if (!/費用[：:]/.test(line)) continue;
    if (/超時|加時/.test(line)) continue;

    const m = line.match(/費用[：:]\s*(.+)$/);
    if (!m) continue;
    const rhs = m[1].trim();
    if (!rhs) continue;
    if (/每小時/.test(rhs) && !/\d{4,}/.test(rhs.replace(/[,\s]/g, ""))) continue;
    if (/每晚/.test(rhs) && /共/.test(rhs)) {
      const share = rhs.match(/共\s*(?:NT\$?|\$)?\s*([\d,\s　]+)/i);
      if (share) push(normalizeMoneyToken(share[1], 500), 40);
      continue;
    }
    if (/=/.test(rhs)) {
      push(evaluateMoneyExpression(rhs), 70);
      continue;
    }
    if (/[+＋×*]/.test(rhs)) {
      const ev = evaluateMoneyExpression(rhs, 100);
      if (ev) {
        push(ev, 72);
        continue;
      }
    }
    const cleaned = rhs.replace(/（[^）]*）/g, " ").replace(/\([^)]*\)/g, " ");
    const share = cleaned.match(/共\s*(?:NT\$?|\$)?\s*([\d,\s]+)/i);
    if (share) {
      push(normalizeMoneyToken(share[1]), 68);
      continue;
    }
    const cash = cleaned.match(/(?:NT\$?|\$)\s*([\d,\s]+)/i);
    if (cash) {
      push(normalizeMoneyToken(cash[1]), 65);
      continue;
    }
    const plain = cleaned.match(/(\d{1,3}(?:[,\s　]\d{3})+|\d{4,})/);
    if (plain) push(normalizeMoneyToken(plain[1]), 60);
  }

  return pickBestCandidate(candidates);
}

export function isPrivateBookingText(text) {
  if (!text) return false;
  return /私[訂定]|私下|(?:^|[\s　])私(?:$|[\s　])/.test(text);
}
