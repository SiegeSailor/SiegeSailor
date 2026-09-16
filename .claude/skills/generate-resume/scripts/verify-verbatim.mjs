import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Keys whose values are chosen by reference/layout.md rather than taken from
// profile/, so they have no source string to match.
const EXEMPT = new Set(["key", "heading", "audience", "pageLimit"]);

const normalise = (value) => String(value).replace(/\s+/g, " ").trim();

export const readSourceText = (dir) =>
  normalise(
    readdirSync(dir)
      .filter((file) => /\.ya?ml$/.test(file))
      .map((file) => readFileSync(join(dir, file), "utf8"))
      .join("\n"),
  );

// The longest run of leading words from `value` that still occurs in the
// source. Empty means nothing recognisable — an invention rather than a
// rewording, which is the more serious of the two.
const nearest = (value, haystack) => {
  const words = value.split(" ");
  let match = "";
  for (let count = 1; count <= words.length; count += 1) {
    const candidate = words.slice(0, count).join(" ");
    if (!haystack.includes(candidate)) break;
    match = candidate;
  }
  if (match.split(" ").length < 2) return null;
  const start = haystack.indexOf(match);
  return haystack.slice(start, start + Math.max(match.length, value.length) + 20);
};

const walk = (node, path, visit) => {
  if (typeof node === "string") return visit(node, path);
  if (Array.isArray(node))
    return node.forEach((item, index) => walk(item, `${path}[${index}]`, visit));
  if (node && typeof node === "object")
    for (const [key, value] of Object.entries(node)) {
      if (EXEMPT.has(key)) continue;
      walk(value, path ? `${path}.${key}` : key, visit);
    }
};

export function verifyVerbatim(plan, sourceText) {
  const haystack = normalise(sourceText);
  const misses = [];

  walk(plan, "", (value, path) => {
    const needle = normalise(value);
    if (!needle || haystack.includes(needle)) return;
    misses.push({ path, value: needle, nearest: nearest(needle, haystack) });
  });

  return { ok: misses.length === 0, misses };
}
