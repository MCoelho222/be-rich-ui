// Fails when en.json and pt.json don't have exactly the same keys (specs/frontend.md §2).
import { readFileSync } from "node:fs";

const load = (locale) => JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url)));

function keys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object" ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );
}

const en = new Set(keys(load("en")));
const pt = new Set(keys(load("pt")));
const missing = [
  ...[...en].filter((k) => !pt.has(k)).map((k) => `pt.json is missing ${k}`),
  ...[...pt].filter((k) => !en.has(k)).map((k) => `en.json is missing ${k}`),
];

if (missing.length) {
  console.error(missing.join("\n"));
  process.exit(1);
}
console.log(`messages: ${en.size} keys, en and pt match`);
