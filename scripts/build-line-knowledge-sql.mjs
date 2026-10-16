import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceFiles = ["knowledge/line/campsite.md", "knowledge/line/campervan.md"];
const outputFile = path.join(root, "migrations/0002_line_knowledge_seed.sql");

function sql(value) {
  return `'${String(value || "").replaceAll("'", "''")}'`;
}

function parseKnowledge(relativePath) {
  const content = fs.readFileSync(path.join(root, relativePath), "utf8");
  const updatedAt = content.match(/更新日期：([^\n]+)/)?.[1]?.trim() || new Date().toISOString().slice(0, 10);
  const sections = content.split(/^## /m).slice(1);
  return sections.map((section) => {
    const [heading, ...lines] = section.split("\n");
    const values = Object.fromEntries(
      lines
        .map((line) => line.match(/^(服務|問題|關鍵字|回答|連結):\s*(.*)$/))
        .filter(Boolean)
        .map((match) => [match[1], match[2].trim()])
    );
    const entry = {
      id: heading.trim(),
      service: values.服務,
      question: values.問題,
      keywords: values.關鍵字,
      answer: values.回答,
      url: values.連結,
      sourceFile: relativePath,
      updatedAt
    };
    for (const [key, value] of Object.entries(entry)) {
      if (!value) throw new Error(`${relativePath} ${entry.id || "unknown"} missing ${key}`);
    }
    return entry;
  });
}

const entries = sourceFiles.flatMap(parseKnowledge);
const ids = new Set();
for (const entry of entries) {
  if (ids.has(entry.id)) throw new Error(`Duplicate knowledge id: ${entry.id}`);
  ids.add(entry.id);
}

const statements = entries.map(
  (entry) =>
    `INSERT INTO line_knowledge (id, service, question, keywords, answer, url, source_file, updated_at, enabled) VALUES (${[
      entry.id,
      entry.service,
      entry.question,
      entry.keywords,
      entry.answer,
      entry.url,
      entry.sourceFile,
      entry.updatedAt
    ].map(sql).join(", ")}, 1) ON CONFLICT(id) DO UPDATE SET service=excluded.service, question=excluded.question, keywords=excluded.keywords, answer=excluded.answer, url=excluded.url, source_file=excluded.source_file, updated_at=excluded.updated_at, enabled=1;`
);

statements.push(
  `INSERT INTO line_knowledge_meta (key, value, updated_at) VALUES ('seed_entry_count', ${sql(entries.length)}, ${sql(new Date().toISOString())}) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at;`
);

fs.writeFileSync(outputFile, `${statements.join("\n")}\n`, "utf8");
console.log(`Generated ${path.relative(root, outputFile)} with ${entries.length} entries.`);
