import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { buildResume } from "../.claude/skills/generate-resume/scripts/build-resume.mjs";

const PLAN = {
  pageLimit: 1,
  identity: { legal: "Jin Yu (Ken) Zhang", display: "Jin Yu (Ken) Zhang" },
  contact: { line1: "NYC Metropolitan Area", line2: "jinyu-zhang.com" },
  sections: [
    { key: "summary", heading: "Summary", text: "Senior software engineer." },
    { key: "experience", heading: "Work Experience", entries: [
      { company: "CooperSurgical", location: "NJ, USA",
        roles: [
          { title: "Senior Software Engineer", dates: "Jun 2025 – Present" },
          { title: "Software Engineer", dates: "Jan 2024 – May 2025" },
        ],
        bullets: ["Architected a cross-product device SDK"] },
    ] },
  ],
};

const build = async () => {
  const dir = mkdtempSync(join(tmpdir(), "resume-"));
  const file = await buildResume(PLAN, dir);
  // A .docx is a zip; document.xml holds the body.
  const xml = execFileSync("unzip", ["-p", file, "word/document.xml"]).toString();
  return { file, xml };
};

test("writes a .docx", async () => {
  const { file } = await build();
  assert.match(file, /\.docx$/);
  assert.ok(readFileSync(file).length > 0);
});

test("never emits a literal bullet character in the body", async () => {
  const { xml } = await build();
  assert.ok(!xml.includes("•"), "found a literal • in document.xml");
});

test("renders the selected bullet text", async () => {
  const { xml } = await build();
  assert.ok(xml.includes("Architected a cross-product device SDK"));
});

test("keeps stacked role lines as separate paragraphs", async () => {
  const { xml } = await build();
  assert.ok(xml.includes("Senior Software Engineer"));
  assert.ok(xml.includes("Software Engineer"));
  assert.ok(xml.includes("Jun 2025 – Present"));
  assert.ok(xml.includes("Jan 2024 – May 2025"));
});

test("right-aligns dates with a right tab stop and a literal tab, not spaces", async () => {
  const { xml } = await build();
  assert.ok(
    xml.includes('<w:tab w:val="right"'),
    "expected a right tab stop declared in the paragraph properties",
  );
  assert.ok(
    /<w:t[^>]*>\tJun 2025/.test(xml),
    "expected the date run to begin with a literal tab character",
  );
  assert.ok(!/ {3,}Jun 2025/.test(xml), "dates must not be positioned with spaces");
});

test("uses no tables, text boxes, headers, or footers", async () => {
  const { xml } = await build();
  for (const tag of ["<w:tbl>", "<w:txbxContent>", "<w:hdr>", "<w:ftr>"]) {
    assert.ok(!xml.includes(tag), `${tag} breaks ATS parsing`);
  }
});

test("renders sections in the order the plan gives", async () => {
  const { xml } = await build();
  assert.ok(xml.indexOf("Summary") < xml.indexOf("Work Experience"));
});
