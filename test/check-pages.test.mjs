import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
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

const STATUSES = new Set(["ok", "over", "unverified"]);

// Writes an executable script to a fresh temp bin directory and returns
// that directory, so tests can prepend it to PATH to shadow a real tool.
const fakeBin = (name, script) => {
  const dir = mkdtempSync(join(tmpdir(), "fakebin-"));
  const file = join(dir, name);
  writeFileSync(file, script);
  chmodSync(file, 0o755);
  return { dir, file };
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
  assert.ok(STATUSES.has(result.status));
});

test("reports unverified, not over, when pdfinfo prints no Pages: line", async () => {
  const dir = mkdtempSync(join(tmpdir(), "pages-"));
  const docx = await buildResume(PLAN, dir);
  // A locale-shifted or otherwise unparsable pdfinfo output must never be
  // read as page count 0 (NaN <= limit is false, which used to read "over").
  const { dir: binDir } = fakeBin("pdfinfo", "#!/bin/bash\necho 'Producer: fake'\n");
  const path = process.env.PATH;
  process.env.PATH = `${binDir}:${path}`;
  try {
    const result = checkPages(docx, dir, 1);
    assert.equal(result.status, "unverified");
    assert.equal(result.pages, null);
    assert.match(result.reason, /Pages/);
    assert.ok(STATUSES.has(result.status));
  } finally {
    process.env.PATH = path;
  }
});

test("reports unverified, not a thrown error, when conversion produces no PDF", async () => {
  const dir = mkdtempSync(join(tmpdir(), "pages-"));
  const docx = await buildResume(PLAN, dir);
  // A soffice that exits 0 without writing a PDF stands in for a real
  // headless failure (disk full, corrupt input, a race on the profile dir).
  // SOFFICE_CMD is read once at module import, so shadow the "soffice" that
  // the default command resolves to on PATH instead of setting the env var
  // mid-process — that would have no effect on the already-cached command.
  const { dir: binDir } = fakeBin("soffice", "#!/bin/bash\nexit 0\n");
  const path = process.env.PATH;
  process.env.PATH = `${binDir}:${path}`;
  try {
    const result = checkPages(docx, dir, 1);
    assert.equal(result.status, "unverified");
    assert.equal(result.pages, null);
    assert.match(result.reason, /PDF/);
    assert.ok(STATUSES.has(result.status));
  } finally {
    process.env.PATH = path;
  }
});
