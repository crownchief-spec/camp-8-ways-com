import fs from "node:fs";
import { sanitizeLegacyCombinedIcs } from "../functions/_lib/public-calendar.js";

const [inputFile, outputFile = inputFile] = process.argv.slice(2);
if (!inputFile) throw new Error("Usage: node scripts/sanitize-calendar-snapshot.mjs INPUT [OUTPUT]");

const source = fs.readFileSync(inputFile, "utf8");
const sanitized = sanitizeLegacyCombinedIcs(source);
fs.writeFileSync(outputFile, sanitized, "utf8");
console.log(`Sanitized public calendar: ${outputFile}`);
