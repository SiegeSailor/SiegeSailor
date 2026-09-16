import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyVerbatim, readSourceText } from "../.claude/skills/generate-resume/scripts/verify-verbatim.mjs";
import { join } from "node:path";

const SOURCE = `
summary:
  - text: >-
      Senior software engineer working on distributed systems
      and developer infrastructure.
experience:
  - company: CooperSurgical
    bullets:
      - text: >-
          Cut RFID data-transition time by 90% with database caching
          and gRPC streaming
`;

test("a plan quoting the source verbatim passes", () => {
  const plan = {
    sections: [
      { key: "experience", heading: "Work Experience", entries: [
        { company: "CooperSurgical", bullets: [
          "Cut RFID data-transition time by 90% with database caching and gRPC streaming",
        ] },
      ] },
    ],
  };
  const result = verifyVerbatim(plan, SOURCE);
  assert.equal(result.ok, true);
  assert.deepEqual(result.misses, []);
});

test("folded YAML line breaks do not cause a false miss", () => {
  const plan = { sections: [{ key: "summary", heading: "Summary",
    text: "Senior software engineer working on distributed systems and developer infrastructure." }] };
  assert.equal(verifyVerbatim(plan, SOURCE).ok, true);
});

test("a reworded bullet is caught and its nearest source line reported", () => {
  const plan = {
    sections: [
      { key: "experience", heading: "Work Experience", entries: [
        { company: "CooperSurgical", bullets: [
          "Cut RFID transition time by 90% using caching and streaming",
        ] },
      ] },
    ],
  };
  const result = verifyVerbatim(plan, SOURCE);
  assert.equal(result.ok, false);
  assert.equal(result.misses.length, 1);
  assert.match(result.misses[0].value, /Cut RFID transition time/);
  assert.match(result.misses[0].nearest, /Cut RFID data-transition time by 90%/);
});

test("an invented bullet is caught with no nearest match", () => {
  const plan = { sections: [{ key: "experience", heading: "Work Experience", entries: [
    { company: "CooperSurgical", bullets: ["Led a team of 5 vendor engineers"] } ] }] };
  const result = verifyVerbatim(plan, SOURCE);
  assert.equal(result.ok, false);
  assert.equal(result.misses[0].nearest, null);
});

test("headings and keys are exempt — they come from layout.md, not profile/", () => {
  const plan = { sections: [{ key: "summary", heading: "Summary",
    text: "Senior software engineer working on distributed systems and developer infrastructure." }] };
  const result = verifyVerbatim(plan, SOURCE);
  assert.equal(result.ok, true);
});

test("readSourceText concatenates every YAML file in the directory", () => {
  const text = readSourceText(join(import.meta.dirname, "../profile"));
  assert.match(text, /CooperSurgical/);
  assert.match(text, /Shopee/);
});

// Regression coverage for the C1/C2/I1/I2 bypasses found in review: the
// module used to build its haystack from raw YAML text and match by
// substring, which let a comment certify the exact phrasing it warned
// against, and let any truncation of a real bullet pass silently.

const COMMENT_SOURCE = `
experience:
  - company: CooperSurgical
    bullets:
      # The window is the claim: first-to-last-day within one festival run,
      # not D1 or D7 cohort retention. Do not compress it back to
      # "player retention".
      - text: >-
          Raised first-to-last-day player retention from 0.25 to 0.65 across
          3-14 day shopping-festival runs
`;

test("a phrase that only appears in a YAML comment is caught, not certified (C1)", () => {
  const plan = { sections: [{ key: "experience", heading: "Work Experience", entries: [
    { company: "CooperSurgical", bullets: ["player retention"] } ] }] };
  const result = verifyVerbatim(plan, COMMENT_SOURCE);
  assert.equal(result.ok, false);
  assert.equal(result.misses.length, 1);
  assert.equal(result.misses[0].value, "player retention");
});

test("a truncated bullet that drops the trailing qualifier is caught (C2)", () => {
  const plan = { sections: [{ key: "experience", heading: "Work Experience", entries: [
    { company: "CooperSurgical", bullets: [
      "Raised first-to-last-day player retention from 0.25 to 0.65",
    ] } ] }] };
  const result = verifyVerbatim(plan, COMMENT_SOURCE);
  assert.equal(result.ok, false);
  assert.equal(result.misses.length, 1);
});

test("prose under heading is caught — headings are allowlisted, not free text (I1)", () => {
  const plan = { sections: [{ key: "summary", heading: "Led a team of 40 engineers",
    text: "Senior software engineer working on distributed systems and developer infrastructure." }] };
  const result = verifyVerbatim(plan, SOURCE);
  assert.equal(result.ok, false);
  assert.equal(result.misses.length, 1);
  assert.equal(result.misses[0].path, "sections[0].heading");
  assert.match(result.misses[0].nearest, /allowed:/);
});

test("a key outside the allowlist is caught (I1)", () => {
  const plan = { sections: [{ key: "hobbies", heading: "Summary",
    text: "Senior software engineer working on distributed systems and developer infrastructure." }] };
  const result = verifyVerbatim(plan, SOURCE);
  assert.equal(result.ok, false);
  assert.equal(result.misses.length, 1);
  assert.equal(result.misses[0].path, "sections[0].key");
  assert.match(result.misses[0].nearest, /allowed:/);
});

test("a numeric leaf not present in the source is caught (I2)", () => {
  const plan = { sections: [{ key: "experience", heading: "Work Experience", entries: [
    { company: "CooperSurgical", yearsOfService: 10 } ] }] };
  const result = verifyVerbatim(plan, SOURCE);
  assert.equal(result.ok, false);
  assert.equal(result.misses.length, 1);
  assert.equal(result.misses[0].value, "10");
});

// Round-2 regression coverage: `propKey` used to be forwarded unchanged into
// array elements, so the `audience`/`pageLimit` scalar exemption leaked onto
// every scalar inside a collection under those keys, at any depth and at any
// location in the plan — including inside an `entries[]` element.

test("a scalar inside an array under audience is still checked, not exempt (I1)", () => {
  const plan = { audience: ["Raised $2M in seed funding"] };
  const result = verifyVerbatim(plan, SOURCE);
  assert.equal(result.ok, false);
  assert.equal(result.misses.length, 1);
  assert.equal(result.misses[0].value, "Raised $2M in seed funding");
});

test("a scalar two arrays deep under pageLimit is still checked, not exempt (I1)", () => {
  const plan = { pageLimit: [["Raised $2M in seed funding", "Managed 40 people"]] };
  const result = verifyVerbatim(plan, SOURCE);
  assert.equal(result.ok, false);
  assert.equal(result.misses.length, 2);
  const values = result.misses.map((miss) => miss.value);
  assert.ok(values.includes("Raised $2M in seed funding"));
  assert.ok(values.includes("Managed 40 people"));
});

test("audience on an entries[] element is still checked, not exempt (I1)", () => {
  const plan = { sections: [{ key: "experience", heading: "Work Experience",
    entries: [{ company: "CooperSurgical", audience: ["Led a team of 40 engineers"] }] }] };
  const result = verifyVerbatim(plan, SOURCE);
  assert.equal(result.ok, false);
  assert.equal(result.misses.length, 1);
  assert.equal(result.misses[0].value, "Led a team of 40 engineers");
});

test("a non-scalar heading is flagged and its nested string is named by value, not swallowed (I1)", () => {
  const plan = { sections: [{ key: "summary", heading: { title: "Led a team of 40 engineers" },
    text: "Senior software engineer working on distributed systems and developer infrastructure." }] };
  const result = verifyVerbatim(plan, SOURCE);
  assert.equal(result.ok, false);
  const values = result.misses.map((miss) => miss.value);
  assert.ok(values.includes("Led a team of 40 engineers"));
  assert.ok(!values.includes("[object Object]"));
});
