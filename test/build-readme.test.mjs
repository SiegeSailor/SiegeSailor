import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReadme } from "../.claude/skills/update-readme/scripts/build-readme.mjs";

const INPUT = {
  identity: { display: "Jin Yu (Ken) Zhang" },
  profile: {
    headlines: ["Senior Software Engineer", "Distributed Systems"],
    status: { location: "NYC Metropolitan Area", position: "CooperSurgical" },
  },
  summary: "Senior software engineer working on distributed systems.",
  projects: [
    {
      title: "Website",
      href: "https://github.com/SiegeSailor/Website",
      stage: "Production",
    },
    {
      title: "Later",
      href: "https://github.com/SiegeSailor/Later",
      stage: "Planning",
    },
    {
      title: "Now",
      href: "https://github.com/SiegeSailor/Now",
      stage: "Development",
    },
  ],
  media: [{ label: "GitHub", href: "https://github.com/SiegeSailor" }],
  site: { domain: "jinyu-zhang.com" },
  timeline: { start: "2017-06-01", excluded: [] },
  versions: { "SiegeSailor/Website": "2.0.0" },
  headings: { summary: "Summary", projects: "Projects", media: "Links" },
};

test("hides Planning projects and orders Production before Development", () => {
  const readme = buildReadme(INPUT);
  assert.ok(!readme.includes("Later"), "Planning projects must not appear");
  assert.ok(readme.indexOf("Website") < readme.indexOf("Now"));
});

test("labels a project with its resolved version, or its stage when absent", () => {
  const readme = buildReadme(INPUT);
  assert.match(
    readme,
    /\[Website\]\(https:\/\/github\.com\/SiegeSailor\/Website\) — v2\.0\.0/,
  );
  assert.match(
    readme,
    /\[Now\]\(https:\/\/github\.com\/SiegeSailor\/Now\) — development/,
  );
});

test("computes experience from the timeline rather than printing a stated figure", () => {
  const readme = buildReadme(INPUT);
  assert.match(readme, /\d+ Years/);
  assert.ok(!readme.includes("undefined"));
});

test("subtracts excluded periods from the experience total", () => {
  const withGap = {
    ...INPUT,
    timeline: {
      start: "2017-06-01",
      excluded: [{ start: "2022-01-01", end: "2024-01-01" }],
    },
  };
  const full = buildReadme(INPUT).match(/(\d+) Years/)[1];
  const gapped = buildReadme(withGap).match(/(\d+) Years/)[1];
  assert.ok(Number(gapped) < Number(full));
});

test("marks the file as generated", () => {
  assert.match(buildReadme(INPUT), /do not edit by hand/i);
});
