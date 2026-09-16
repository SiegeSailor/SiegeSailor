import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildResume } from "../.claude/skills/generate-resume/scripts/build-resume.mjs";
import { checkPages } from "../.claude/skills/generate-resume/scripts/check-pages.mjs";

const PLAN = {
  pageLimit: 1,
  identity: { legal: "Jin Yu (Ken) Zhang", display: "Jin Yu (Ken) Zhang" },
  contact: { line1: "NYC Metropolitan Area", line2: "jinyu-zhang.com" },
  sections: [{ key: "summary", heading: "Summary", text: "Senior software engineer." }],
};

test("a short resume converts and reports one page", async () => {
  const dir = mkdtempSync(join(tmpdir(), "pages-"));
  const result = checkPages(await buildResume(PLAN, dir), dir, 1);
  assert.equal(result.status, "ok");
  assert.equal(result.pages, 1);
  assert.match(result.pdf, /\.pdf$/);
});

test("reports unverified rather than ok when the toolchain is absent", async () => {
  const dir = mkdtempSync(join(tmpdir(), "pages-"));
  const docx = await buildResume(PLAN, dir);
  const path = process.env.PATH;
  process.env.PATH = "/nonexistent";
  try {
    const result = checkPages(docx, dir, 1);
    assert.equal(result.status, "unverified");
    assert.equal(result.pages, null);
    assert.match(result.reason, /LibreOffice|soffice/i);
  } finally {
    process.env.PATH = path;
  }
});

test("reports over when the document exceeds the limit", async () => {
  const dir = mkdtempSync(join(tmpdir(), "pages-"));
  const long = {
    ...PLAN,
    sections: [{ key: "activities", heading: "Activities",
      items: Array.from({ length: 400 }, (_, index) => `Line number ${index} of filler text`) }],
  };
  const result = checkPages(await buildResume(long, dir), dir, 1);
  assert.equal(result.status, "over");
  assert.ok(result.pages > 1);
});
