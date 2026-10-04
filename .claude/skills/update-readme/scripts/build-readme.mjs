// Renders SiegeSailor/SiegeSailor's README from an input object assembled by
// the update-readme skill from profile/. Ported from the Website repo's
// build-readme.mjs, which drove the same file through a clone-and-push
// workflow — this module reads nothing and writes nothing; it only composes
// and returns the string.
const REGEX_GITHUB_REPO = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)/;
// Presentation order, not content: Planning projects are hidden entirely.
const STAGE_ORDER = { Production: 0, Development: 1, Planning: 2 };
const MILLISECOND_ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

// Total experience is timeline.yaml applied to today, not a stated figure.
// source/settings/content.ts in the Website repo computes the
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
// Rendered by GitHub on every view, so the version is never a stale snapshot.
// `tag` rather than `release` also covers a project that versions by tag alone.
const versionBadge = (key) =>
  `![version](https://img.shields.io/github/v/tag/${key}?sort=semver&label=)`;

// A table rather than a list: GitHub strips inline styles, so a badge beside
// text top-aligns, while a badge alone in its cell has nothing to misalign with.
// Cells are padded the way Prettier pads them, so `format:check` passes.
function table(rows) {
  const widths = rows[0].map((_, column) =>
    Math.max(...rows.map((row) => row[column].length)),
  );
  const line = (cells) =>
    `| ${cells.map((cell, column) => cell.padEnd(widths[column])).join(" | ")} |`;
  const [header, ...body] = rows;
  return [
    line(header),
    line(widths.map((width) => "-".repeat(width))),
    ...body.map(line),
  ];
}

export function buildReadme({
  identity,
  headlines,
  location,
  position,
  summary,
  projects,
  media,
  timeline,
  headings,
}) {
  const projectRows = (projects || [])
    .filter((project) => project.stage !== "Planning")
    .sort((left, right) => STAGE_ORDER[left.stage] - STAGE_ORDER[right.stage])
    .map((project) => {
      const key = repoKey(project.href);
      return [
        `[${project.title}](${project.href})`,
        key ? versionBadge(key) : project.stage.toLowerCase(),
      ];
    });

  const links = (media || [])
    .map((entry) => `[${entry.label}](${entry.href})`)
    .join(" · ");

  const readme = [
    `# ${identity.display}`,
    "",
    `**${headlines.join(" · ")}**`,
    "",
    `${location} · ${position} · ${experienceYears(timeline)} experience`,
    "",
    `## ${headings.summary}`,
    "",
    summary.trim(),
    "",
    `## ${headings.projects}`,
    "",
    ...table([["Project", "Version"], ...projectRows]),
    "",
    `## ${headings.media}`,
    "",
    links,
  ].join("\n");

  return `${readme}\n`;
}
