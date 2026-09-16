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
