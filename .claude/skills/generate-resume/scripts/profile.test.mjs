import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";

const DIR = join(import.meta.dirname, "../../../../profile");
const FILES = readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f));

const EXPECTED = [
  "activities.yaml",
  "certifications.yaml",
  "contact.yaml",
  "education.yaml",
  "experience.yaml",
  "identity.yaml",
  "media.yaml",
  "projects.yaml",
  "publications.yaml",
  "skills.yaml",
  "summary.yaml",
  "timeline.yaml",
];

test("every expected profile file is present", () => {
  assert.deepEqual(FILES.sort(), EXPECTED);
});

test("every file parses and holds exactly one top-level key", () => {
  for (const file of FILES) {
    const document = load(readFileSync(join(DIR, file), "utf8"));
    assert.ok(document, `${file} is empty`);
    assert.equal(
      Object.keys(document).length,
      1,
      `${file} must hold exactly one top-level key, found ${Object.keys(document).join(", ")}`,
    );
  }
});

test("no envelope keys survive the migration", () => {
  for (const file of FILES) {
    const raw = readFileSync(join(DIR, file), "utf8");
    for (const key of ["consumers:", "heading:", "archived:"]) {
      assert.ok(
        !raw.includes(key),
        `${file} still carries \`${key}\` — the tagging system is removed`,
      );
    }
  }
});
