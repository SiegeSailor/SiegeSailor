import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { buildResume } from "./build-resume.mjs";

const PLAN = {
  pageLimit: 1,
  identity: { legal: "Jin Yu Zhang", display: "Jin Yu Zhang" },
  contact: [["NYC Metropolitan Area"], ["jinyu-zhang.com"]],
  sections: [
    { key: "summary", heading: "Summary", text: "Senior software engineer." },
    {
      key: "experience",
      heading: "Work Experience",
      entries: [
        {
          company: "CooperSurgical",
          location: "NJ, USA",
          blurb:
            "Medical device R&D — global IVF device leader operating in 130+ countries",
          roles: [
            { title: "Senior Software Engineer", dates: "Jun 2025 – Present" },
            { title: "Software Engineer", dates: "Jan 2024 – May 2025" },
          ],
          bullets: ["Architected a cross-product device SDK"],
        },
      ],
    },
  ],
};

// A .docx is a zip; document.xml holds the body.
const bodyOf = (file) =>
  execFileSync("unzip", ["-p", file, "word/document.xml"]).toString();

const build = async (plan = PLAN) => {
  const dir = mkdtempSync(join(tmpdir(), "resume-"));
  const file = await buildResume(plan, dir);
  return { file, xml: bodyOf(file) };
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
  assert.ok(
    !/ {3,}Jun 2025/.test(xml),
    "dates must not be positioned with spaces",
  );
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

test("renders the entry blurb, a bare string in the plan", async () => {
  const { xml } = await build();
  assert.ok(
    // "&" is escaped by the XML serializer; match the escaped form.
    xml.includes(
      "Medical device R&amp;D — global IVF device leader operating in 130+ countries",
    ),
  );
});

test("prints a lone title and its dates on the company line", async () => {
  const plan = structuredClone(PLAN);
  plan.sections[1].entries[0].roles.splice(1);
  const { xml } = await build(plan);
  const line = xml.split("</w:p>").find((p) => p.includes("CooperSurgical"));
  assert.ok(line.includes("Senior Software Engineer"));
  assert.ok(line.includes("Jun 2025 – Present"));
});

test("never emits an empty text run — a nested-field slip renders a blank line", async () => {
  const { xml } = await build();
  assert.ok(
    !/<w:t[^>]*><\/w:t>/.test(xml),
    "found an empty <w:t> run in document.xml",
  );
});
