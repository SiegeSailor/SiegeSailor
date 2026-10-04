import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReadme } from "./build-readme.mjs";

const INPUT = {
  identity: { display: "Jin Yu Zhang" },
  headlines: ["Distributed Systems", "Platform Engineering"],
  location: "NYC Metropolitan Area",
  position: "Senior Software Engineer",
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
    {
      title: "Unhosted",
      href: "https://github.com/SiegeSailor",
      stage: "Production",
    },
  ],
  media: [{ label: "GitHub", href: "https://github.com/SiegeSailor" }],
  timeline: { start: "2017-06-01", excluded: [] },
  headings: { summary: "Summary", projects: "Projects", media: "Links" },
};

test("hides Planning projects and orders Production before Development", () => {
  const readme = buildReadme(INPUT);
  assert.ok(!readme.includes("Later"), "Planning projects must not appear");
  assert.ok(readme.indexOf("Website") < readme.indexOf("Now"));
});

test("tabulates each repository with a live version badge, or its stage without one", () => {
  const readme = buildReadme(INPUT);
  assert.match(
    readme,
    /^\| \[Website\]\(https:\/\/github\.com\/SiegeSailor\/Website\) +\| !\[version\]\(https:\/\/img\.shields\.io\/github\/v\/tag\/SiegeSailor\/Website\?sort=semver&label=\) +\|$/m,
  );
  assert.match(
    readme,
    /^\| \[Unhosted\]\(https:\/\/github\.com\/SiegeSailor\) +\| production +\|$/m,
  );
});

test("pads the projects table so every row is the same width", () => {
  const rows = buildReadme(INPUT)
    .split("\n")
    .filter((line) => line.startsWith("|"));
  assert.equal(rows.length, 5);
  assert.equal(new Set(rows.map((row) => row.length)).size, 1);
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

test("ends with the links, with no footer after them", () => {
  assert.ok(
    buildReadme(INPUT).endsWith("[GitHub](https://github.com/SiegeSailor)\n"),
  );
});
