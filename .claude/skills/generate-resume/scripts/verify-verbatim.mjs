import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";

// `key` and `heading` are chosen by reference/layout.md, not copied from
// profile/, but they are still rendered — so they are checked against a
// closed allowlist rather than skipped outright. They are validated as a
// pair, not independently: a `key`/`heading` combination that mixes two
// otherwise-valid entries (e.g. `education` under "Work Experience") is
// exactly as much a miss as either one being unknown on its own — see the
// F1 finding in the whole-branch review.
const KEY_TO_HEADING = new Map([
  ["summary", "Summary"],
  ["skills", "Skills"],
  ["experience", "Work Experience"],
  ["publications", "Publications"],
  ["education", "Education"],
  ["certifications", "Certifications"],
  ["activities", "Activities"],
]);
const ALLOWED_KEYS_LIST = [...KEY_TO_HEADING.keys()].sort();
const ALLOWED_HEADINGS_LIST = [...new Set(KEY_TO_HEADING.values())].sort();

// POLICY.md forbids rendering StageSource or DY Game as employment: both are
// student engagements (a Boston University course team and a B.F.A.
// internship) that print only as a detail under their degree. Every string
// in an offending plan is genuine source text, so verifyVerbatim's leaf check
// alone would certify it — this is a structural guard on top of that check.
const FORBIDDEN_EXPERIENCE_COMPANIES = new Set(["stagesource", "dy game"]);

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

// Validates `key` and `heading` together, on any object that carries either.
// A `key` outside the map is a miss on its own, exactly as before. Once the
// `key` is valid, the paired `heading` must be that key's own value — a
// different (even otherwise-legitimate) heading is a miss naming what was
// expected. Only when the `key` itself is invalid do we fall back to
// checking `heading` against the flat set of legitimate headings, so a plan
// with an unknown `key` alongside a perfectly ordinary `heading` still
// reports just the one miss.
function checkKeyHeadingPair(node, path, misses, leafSet) {
  const hasKey = Object.prototype.hasOwnProperty.call(node, "key");
  const hasHeading = Object.prototype.hasOwnProperty.call(node, "heading");
  if (!hasKey && !hasHeading) return;

  const keyNode = node.key;
  const headingNode = node.heading;
  const keyPath = path ? `${path}.key` : "key";
  const headingPath = path ? `${path}.heading` : "heading";
  const expectedHeading = isScalar(keyNode) ? KEY_TO_HEADING.get(keyNode) : undefined;
  const keyValid = expectedHeading !== undefined;

  if (hasKey && !keyValid) {
    misses.push({ path: keyPath, value: describe(keyNode), nearest: `allowed: ${ALLOWED_KEYS_LIST.join(", ")}` });
    // A smuggled object/array must still be walked — otherwise the facts
    // hidden inside it never reach `misses` at all.
    if (keyNode !== null && typeof keyNode === "object") walk(keyNode, keyPath, null, misses, leafSet);
  }

  if (hasHeading) {
    if (keyValid) {
      if (headingNode !== expectedHeading) {
        misses.push({ path: headingPath, value: describe(headingNode), nearest: `allowed: ${expectedHeading}` });
        if (headingNode !== null && typeof headingNode === "object") walk(headingNode, headingPath, null, misses, leafSet);
      }
    } else if (!(isScalar(headingNode) && ALLOWED_HEADINGS_LIST.includes(headingNode))) {
      misses.push({ path: headingPath, value: describe(headingNode), nearest: `allowed: ${ALLOWED_HEADINGS_LIST.join(", ")}` });
      if (headingNode !== null && typeof headingNode === "object") walk(headingNode, headingPath, null, misses, leafSet);
    }
  }
}

// Structural guard for the POLICY.md rule that no employment-verification
// vendor should be sent after StageSource or DY Game, since neither was a
// job. Every string a plan uses to render them is genuine source text, so
// the verbatim leaf check alone would pass an entry that POLICY.md forbids —
// this looks at the section's shape instead of its strings. Matches
// case-insensitively on the trimmed company name; education.yaml sections
// (key !== "experience") are never touched by this check.
function checkForbiddenExperienceEntries(node, path, misses) {
  if (node.key !== "experience" || !Array.isArray(node.entries)) return;
  node.entries.forEach((entry, index) => {
    if (!entry || typeof entry !== "object" || typeof entry.company !== "string") return;
    const normalisedCompany = entry.company.trim().toLowerCase();
    if (!FORBIDDEN_EXPERIENCE_COMPANIES.has(normalisedCompany)) return;
    misses.push({
      path: `${path ? `${path}.` : ""}entries[${index}].company`,
      value: entry.company,
      nearest:
        `${entry.company} is a student engagement, not employment — it prints only under its ` +
        "degree, never as a Work Experience entry (see profile/POLICY.md)",
    });
  });
}

const walk = (node, path, propKey, misses, leafSet) => {
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
    checkKeyHeadingPair(node, path, misses, leafSet);
    checkForbiddenExperienceEntries(node, path, misses);

    for (const [key, value] of Object.entries(node)) {
      // `key`/`heading` were just validated as a pair above — never walk
      // them individually, or the old independent checks would resurrect
      // themselves as a second pass.
      if (key === "key" || key === "heading") continue;
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
