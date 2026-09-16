import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Renders SiegeSailor/SiegeSailor's README from an input object assembled by
// the update-readme skill from profile/. Ported from the Website repo's
// build-readme.mjs, which drove the same file through a clone-and-push
// workflow — this module reads nothing and writes nothing; it only composes
// and returns the string.
const REGEX_GITHUB_REPO = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)/;
// Presentation order, not content: Planning projects are hidden entirely.
const STAGE_ORDER = { Production: 0, Development: 1, Planning: 2 };
const MILLISECOND_ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

// This repository, hardcoded: site-identity.yaml (the source of the
// website's domain) was deliberately not migrated into profile/, so the
// generated-from line names this repository instead of the /about page.
const REPO_URL = "https://github.com/SiegeSailor/SiegeSailor";
const REPO_LABEL = "SiegeSailor/SiegeSailor";

// Total experience is timeline.yaml applied to today, not a stated figure.
// source/website/helpers/server/content.ts in the Website repo computes the
// same thing from the same content.
function experienceYears(timeline) {
  const { start, excluded = [] } = timeline;
  const total = new Date().getTime() - new Date(start).getTime();
  const skipped = excluded.reduce(
    (sum, period) =>
      sum + (new Date(period.end).getTime() - new Date(period.start).getTime()),
    0,
  );
  const [year, month] = ((total - skipped) / MILLISECOND_ONE_YEAR)
    .toFixed(1)
    .split(".");
  const monthFloor = Math.floor((Number(month) / 10) * 12);
  return `${year} Years ${month === "0" ? "" : `${monthFloor} Months`}`.trim();
}

const repoKey = (href) => {
  const match = String(href).match(REGEX_GITHUB_REPO);
  return match ? `${match[1]}/${match[2].replace(/\.git$/, "")}` : null;
};
const versionLabel = (version) =>
  /^v/i.test(version) ? version : `v${version}`;

export function buildReadme({
  identity,
  profile,
  summary,
  projects,
  media,
  // Unused: no site-identity.yaml exists in profile/ to source a domain from.
  site,
  timeline,
  versions,
  headings,
}) {
  const projectLines = (projects || [])
    .filter((project) => project.stage !== "Planning")
    .sort((left, right) => STAGE_ORDER[left.stage] - STAGE_ORDER[right.stage])
    .map((project) => {
      const key = repoKey(project.href);
      const version = key ? versions[key] : null;
      return `- [${project.title}](${project.href}) — ${
        version ? versionLabel(version) : project.stage.toLowerCase()
      }`;
    });

  const links = (media || [])
    .map((entry) => `[${entry.label}](${entry.href})`)
    .join(" · ");

  const readme = [
    `# ${identity.display}`,
    "",
    `**${profile.headlines.join(" · ")}**`,
    "",
    `${profile.status.location} · ${profile.status.position} · ${experienceYears(timeline)} experience`,
    "",
    `## ${headings.summary}`,
    "",
    summary.trim(),
    "",
    `## ${headings.projects}`,
    "",
    ...projectLines,
    "",
    `## ${headings.media}`,
    "",
    links,
    "",
    "---",
    "",
    `<sub>Generated from <a href="${REPO_URL}">${REPO_LABEL}</a> — do not edit by hand.</sub>`,
    "",
  ].join("\n");

  return `${readme}\n`;
}

async function ghApiJson(path) {
  const { stdout } = await execFileAsync("gh", ["api", path]);
  return JSON.parse(stdout);
}

// Never throws: a project without a resolvable version simply falls back to
// its stage in buildReadme. Tries the latest release first, then the newest
// tag, in case a project versions by tag alone.
export async function resolveVersions(projects) {
  const versions = {};
  for (const project of projects || []) {
    const key = repoKey(project.href);
    if (!key) continue;

    try {
      const release = await ghApiJson(`repos/${key}/releases/latest`);
      if (release?.tag_name) {
        versions[key] = release.tag_name;
        continue;
      }
    } catch {
      // No releases (or no access) — fall back to tags below.
    }

    try {
      const tags = await ghApiJson(`repos/${key}/tags`);
      if (tags?.[0]?.name) versions[key] = tags[0].name;
    } catch {
      // No tags either — the project shows its stage instead.
    }
  }
  return versions;
}
