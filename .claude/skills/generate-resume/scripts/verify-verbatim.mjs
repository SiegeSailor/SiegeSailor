import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";

// `key` and `heading` are chosen by reference/layout.md, not copied from
// profile/, but they are still rendered — so they are checked against a
// closed allowlist rather than skipped outright.
const ALLOWED_KEYS = new Set([
  "summary", "skills", "experience", "publications",
  "education", "certifications", "activities",
]);
const ALLOWED_HEADINGS = new Set([
  "Summary", "Skills", "Work Experience", "Publications",
  "Education", "Certifications", "Activities",
]);
const ALLOWED_KEYS_LIST = [...ALLOWED_KEYS].sort();
const ALLOWED_HEADINGS_LIST = [...ALLOWED_HEADINGS].sort();

// `audience` and `pageLimit` carry no source string to match — but only when
// their own value is a scalar. An object or array under either name still
// gets walked, so nothing can hide a fact underneath them.
const SCALAR_EXEMPT = new Set(["audience", "pageLimit"]);

const normalise = (value) => String(value).replace(/\s+/g, " ").trim();

const isScalar = (node) =>
  typeof node === "string" || typeof node === "number" || typeof node === "boolean";

// Collects every scalar leaf of a parsed YAML document into a set of
// normalised strings. Comments, keys, and YAML syntax never reach this set —
// only values a document actually asserts can certify a plan string.
const collectLeaves = (node, leaves) => {
  if (node === null || node === undefined) return;
  if (isScalar(node)) {
    leaves.add(normalise(node));
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item) => collectLeaves(item, leaves));
    return;
  }
  if (typeof node === "object") {
    for (const value of Object.values(node)) collectLeaves(value, leaves);
  }
};

export const readSourceText = (dir) =>
  readdirSync(dir)
    .filter((file) => /\.ya?ml$/.test(file))
    .map((file) => readFileSync(join(dir, file), "utf8"))
    .join("\n");

const commonPrefixWordCount = (a, b) => {
  const aWords = a.split(" ");
  const bWords = b.split(" ");
  let count = 0;
  while (count < aWords.length && count < bWords.length && aWords[count] === bWords[count]) {
    count += 1;
  }
  return count;
};

// The source leaf sharing the longest run of leading words with `value`,
// ties broken toward the shorter leaf. Fewer than two shared words means
// nothing recognisable — an invention rather than a rewording or a
// truncation, which are both less serious.
const nearest = (value, leafSet) => {
  let best = null;
  let bestCount = 0;
  for (const leaf of leafSet) {
    const count = commonPrefixWordCount(value, leaf);
    if (count > bestCount || (count > 0 && count === bestCount && leaf.length < best.length)) {
      best = leaf;
      bestCount = count;
    }
  }
  return bestCount < 2 ? null : best;
};

const describe = (node) => (isScalar(node) ? String(node) : JSON.stringify(node));

const walk = (node, path, propKey, misses, leafSet) => {
  if (propKey === "key" || propKey === "heading") {
    const allowed = propKey === "key" ? ALLOWED_KEYS : ALLOWED_HEADINGS;
    const list = propKey === "key" ? ALLOWED_KEYS_LIST : ALLOWED_HEADINGS_LIST;
    if (!allowed.has(node)) {
      misses.push({ path, value: describe(node), nearest: `allowed: ${list.join(", ")}` });
      // A smuggled object/array must still be walked — otherwise the facts
      // hidden inside it never reach `misses` at all.
      if (node !== null && typeof node === "object") walk(node, path, null, misses, leafSet);
    }
    return;
  }

  if (node === null || node === undefined) {
    misses.push({ path, value: String(node), nearest: null });
    return;
  }

  if (isScalar(node)) {
    if (SCALAR_EXEMPT.has(propKey)) return;
    const needle = normalise(node);
    if (!leafSet.has(needle)) {
      misses.push({ path, value: needle, nearest: nearest(needle, leafSet) });
    }
    return;
  }

  if (Array.isArray(node)) {
    // Exemption belongs to a direct scalar child of the key that grants it —
    // never forward `propKey` into a collection, or every element inside an
    // `audience`/`pageLimit` array (at any depth) would inherit the pass.
    node.forEach((item, index) => walk(item, `${path}[${index}]`, null, misses, leafSet));
    return;
  }

  if (typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      walk(value, path ? `${path}.${key}` : key, key, misses, leafSet);
    }
  }
};

export function verifyVerbatim(plan, sourceText) {
  const leafSet = new Set();
  collectLeaves(load(sourceText), leafSet);

  const misses = [];
  walk(plan, "", null, misses, leafSet);

  return { ok: misses.length === 0, misses };
}
