import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";

const FONT = "Calibri";
// Sizes are half-points; spacing/indents are twips (1440 = 1 inch).
const SZ = { name: 32, contact: 18, section: 20, body: 19, blurb: 18 };
// Tightened to keep the resume on one US-Letter page after the Certifications
// section was split out of Education (see this workspace's CONTRIBUTING.md).
const SPACE = {
  afterBullet: 9,
  afterBody: 32,
  beforeSection: 44,
  afterSection: 26,
};
const RIGHT_TAB = 12240 - 792 * 2;

const clean = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();

// LibreOffice ignores docx PositionalTab; right-aligned dates need a classic
// right tab stop plus a literal "\t" in the run.
const splitLine = (leftRuns, rightText, opts = {}) =>
  new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
    ...opts,
    children: rightText
      ? [
          ...leftRuns,
          new TextRun({
            text: "\t" + clean(rightText),
            font: FONT,
            size: SZ.body,
          }),
        ]
      : leftRuns,
  });

const sectionHeader = (text) =>
  new Paragraph({
    spacing: { before: SPACE.beforeSection, after: SPACE.afterSection },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "444444", space: 2 },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        font: FONT,
        size: SZ.section,
        allCaps: true,
      }),
    ],
  });

const bullet = (text) =>
  new Paragraph({
    numbering: { reference: "resume-bullets", level: 0 },
    spacing: { after: SPACE.afterBullet },
    children: [new TextRun({ text: clean(text), font: FONT, size: SZ.body })],
  });

const bodyLine = (runs, opts = {}) =>
  new Paragraph({
    spacing: { after: SPACE.afterBody },
    ...opts,
    children: runs,
  });

const buildHeader = (plan) => [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [
      new TextRun({
        // Upper-casing is presentation, so content stores the name as written.
        text: clean(plan.identity.legal).toUpperCase(),
        bold: true,
        font: FONT,
        size: SZ.name,
      }),
    ],
  }),
  // Each contact line is a list of `contact.yaml` values, joined by "|".
  ...plan.contact.map(
    (fields) =>
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: fields.map(clean).join("  |  "),
            font: FONT,
            size: SZ.contact,
          }),
        ],
      }),
  ),
];

const buildSummary = (section) => {
  const text = section.text;
  if (!text) return [];
  return [
    sectionHeader(section.heading),
    bodyLine([new TextRun({ text: clean(text), font: FONT, size: SZ.body })]),
  ];
};

const buildSkills = (section) => {
  const rows = section.rows || [];
  if (!rows.length) return [];
  return [
    sectionHeader(section.heading),
    ...rows.map((s) =>
      bodyLine(
        [
          new TextRun({
            // Rows given together print as 1: labels joined by "&", items by ";".
            text: `${[].concat(s.label).join(" & ")}: `,
            bold: true,
            font: FONT,
            size: SZ.body,
          }),
          new TextRun({
            text: [].concat(s.items).map(clean).join("; "),
            font: FONT,
            size: SZ.body,
          }),
        ],
        { spacing: { after: 20 } },
      ),
    ),
  ];
};

const buildExperience = (section) => {
  const jobs = section.entries || [];
  if (!jobs.length) return [];
  const out = [sectionHeader(section.heading)];
  for (const job of jobs) {
    const bullets = job.bullets || [];
    if (!bullets.length) continue;

    const roles = job.roles || [];
    out.push(
      splitLine(
        [
          new TextRun({
            text: job.company,
            bold: true,
            font: FONT,
            size: SZ.body,
          }),
          new TextRun({
            text: ` — ${clean(job.location)}`,
            font: FONT,
            size: SZ.body,
          }),
        ],
        roles.length === 1 ? roles[0].dates : "",
        { spacing: { before: 60, after: 10 } },
      ),
    );
    if (job.blurb)
      out.push(
        bodyLine(
          [
            new TextRun({
              text: clean(job.blurb),
              italics: true,
              font: FONT,
              size: SZ.blurb,
            }),
          ],
          { spacing: { after: 20 } },
        ),
      );
    if (roles.length === 1) {
      out.push(
        bodyLine(
          [
            new TextRun({
              text: roles[0].title,
              bold: true,
              italics: true,
              font: FONT,
              size: SZ.body,
            }),
          ],
          { spacing: { after: 20 } },
        ),
      );
    } else {
      for (const role of roles)
        out.push(
          splitLine(
            [
              new TextRun({
                text: role.title,
                bold: true,
                italics: true,
                font: FONT,
                size: SZ.body,
              }),
            ],
            role.dates,
            { spacing: { after: 10 } },
          ),
        );
    }
    out.push(...bullets.map(bullet));
  }
  return out;
};

const buildPublications = (section) => {
  const publications = section.items || [];
  if (!publications.length) return [];
  return [
    sectionHeader(section.heading),
    ...publications.map((p) =>
      bodyLine([new TextRun({ text: clean(p), font: FONT, size: SZ.body })]),
    ),
  ];
};

const COURSE_LIST = new Intl.ListFormat("en", { type: "conjunction" });

const buildSchools = (section) => {
  const rows = section.entries || [];
  if (!rows.length) return [];
  const out = [sectionHeader(section.heading)];
  for (const entry of rows) {
    out.push(
      splitLine(
        [
          new TextRun({
            text: entry.school,
            bold: true,
            font: FONT,
            size: SZ.body,
          }),
          new TextRun({
            text: ` — ${clean(entry.degree)}`,
            font: FONT,
            size: SZ.body,
          }),
        ],
        entry.dates,
        { spacing: { before: 40, after: 10 } },
      ),
    );
    const standing = [
      entry.rank && `Ranked ${entry.rank}`,
      entry.score && `score ${entry.score}`,
    ].filter(Boolean);
    if (standing.length) out.push(bullet(standing.join("; ")));
    if (entry.courses?.length)
      out.push(bullet(`Coursework: ${COURSE_LIST.format(entry.courses)}`));
    for (const detail of entry.details || []) out.push(bullet(detail));
  }
  return out;
};

const dated = (text, dates) => (dates ? `${text} (${dates})` : text);

// "Role, Organization, Event (Dates) — detail", or for a pastime,
// "Activity — Organization (Dates), ...". Every part but the first is optional.
const activityLine = (item) => {
  const head =
    item.activity ??
    dated(
      [item.role, item.organization, item.event].filter(Boolean).join(", "),
      item.dates,
    );
  const tail = item.entries
    ? item.entries.map((e) => dated(e.organization, e.dates)).join(", ")
    : item.detail;
  return tail ? `${head} — ${tail}` : head;
};

const buildActivities = (section) => {
  const items = section.items || [];
  if (!items.length) return [];
  return [
    sectionHeader(section.heading),
    ...items.map((item) => bullet(activityLine(item))),
  ];
};

const BUILDERS = {
  summary: buildSummary,
  skills: buildSkills,
  experience: buildExperience,
  publications: buildPublications,
  education: buildSchools,
  certifications: buildSchools,
  activities: buildActivities,
};

const buildSections = (plan) =>
  plan.sections.flatMap((section) => {
    const build = BUILDERS[section.key];
    if (!build)
      throw new Error(
        `plan section "${section.key}" has no builder; known keys are ${Object.keys(BUILDERS).join(", ")}`,
      );
    return build(section);
  });

export async function buildResume(plan, outputDir) {
  const doc = new Document({
    title: `${clean(plan.identity.display)} — Resume`,
    creator: clean(plan.identity.display),
    subject: "Resume",
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SZ.body },
          paragraph: { spacing: { line: 226 } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "resume-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 280, hanging: 160 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 600, bottom: 600, left: 792, right: 792 },
          },
        },
        children: [...buildHeader(plan), ...buildSections(plan)],
      },
    ],
  });

  mkdirSync(outputDir, { recursive: true });
  const file = join(outputDir, "JinYu-Zhang-Resume.docx");
  writeFileSync(file, await Packer.toBuffer(doc));
  return file;
}
