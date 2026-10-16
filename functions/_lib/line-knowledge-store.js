function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s，。！？、,.!?：:；;（）()「」『』【】\-_/]/g, "");
}

function scoreEntry(text, entry) {
  const normalizedText = normalize(text);
  let score = 0;
  const keywords = String(entry.keywords || "")
    .split("|")
    .map((keyword) => normalize(keyword))
    .filter((keyword) => keyword.length >= 2);

  for (const keyword of keywords) {
    if (normalizedText.includes(keyword)) score += 4 + Math.min(keyword.length, 8);
  }
  const question = normalize(entry.question);
  if (question && (question.includes(normalizedText) || normalizedText.includes(question))) score += 6;
  return score;
}

export async function findRelevantLineKnowledge(env, { text, service, limit = 3 }) {
  if (!env.LINE_KNOWLEDGE?.prepare) return [];
  const query = service
    ? env.LINE_KNOWLEDGE.prepare(
        "SELECT id, service, question, keywords, answer, url FROM line_knowledge WHERE enabled = 1 AND service IN (?, 'shared') LIMIT 160"
      ).bind(service)
    : env.LINE_KNOWLEDGE.prepare(
        "SELECT id, service, question, keywords, answer, url FROM line_knowledge WHERE enabled = 1 LIMIT 160"
      );
  const result = await query.all();
  return (result.results || [])
    .map((entry) => ({ ...entry, score: scoreEntry(text, entry) }))
    .filter((entry) => entry.score >= 6)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit);
}

export function formatRetrievedKnowledge(entries) {
  return entries
    .map(
      (entry, index) =>
        `${index + 1}. 常見問題：${entry.question}\n核定答案：${entry.answer}\n相關頁面：${entry.url}`
    )
    .join("\n\n");
}

export function directKnowledgeReply(entry) {
  if (!entry) return null;
  return `您好～謝謝您詢問！\n${entry.answer}\n\n詳細資訊：${entry.url}`;
}
