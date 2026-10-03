---
name: update-readme
description: Use when updating, syncing, or regenerating the GitHub profile README from profile facts.
---

# Update README

Regenerates this repository's `README.md` — the GitHub profile README — from `profile/`.

## Headings

The 3 section titles are fixed, not sourced from `profile/`:

```js
const headings = { summary: "Summary", projects: "Projects", media: "Links" };
```

Pass this object as `headings` to `buildReadme`. Never invent different titles.

## Summary

Each run writes a new summary and new headlines for the audience the request names, per **Audience** in [`profile/CLAUDE.md`](../../../profile/CLAUDE.md), and asks Jin Yu Zhang for one when it names none. Jin Yu Zhang approves their wording in the diff from **Process** step 6.

## Input Shape

`buildReadme` destructures exactly 10 fields. `summary` and `headlines` are written per run, `versions` is computed, and `headings` is fixed; every other field is read straight out of `profile/` and passed through as-is. `buildReadme` calls `.trim()` directly on `summary`, so it must be a **bare string**, never `summary.yaml`'s array or 1 of its `{ text }` entries. Read this table rather than rediscovering the shapes in `build-readme.mjs`:

| Field       | Source                                 | Shape `buildReadme` Needs                    | Unwrap Needed?                                                          |
| ----------- | -------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `headings`  | not from `profile/`                    | `{ summary, projects, media }`               | Fixed — the literal object in **Headings** above, never invented        |
| `headlines` | written per run, per **Summary** above | `string[]`                                   | No — write them as strings                                              |
| `identity`  | `identity.yaml`'s `identity:` key      | `{ legal, display }`                         | No — pass through; only `.display` is read                              |
| `location`  | `contact.yaml`'s `contact.area`        | `string`                                     | Yes — pass `area` alone, never the whole `contact` object               |
| `media`     | `media.yaml`'s `media:` key            | `[{ key, label, href }, ...]`                | No — pass through                                                       |
| `position`  | `experience.yaml`'s current role       | `string`                                     | Yes — pass `experience[0].roles[0].title`                               |
| `projects`  | `projects.yaml`'s `projects:` key      | `[{ title, href, stage, description }, ...]` | No — pass through (`description` is read but unused by the README)      |
| `summary`   | written per run, per **Summary** above | bare `string`                                | No — write it as a string, not as a `{ text }` entry                    |
| `timeline`  | `timeline.yaml`'s `timeline:` key      | `{ start, excluded: [{ start, end }, ...] }` | No — pass through                                                       |
| `versions`  | not from `profile/`                    | `{ "<owner>/<repo>": "<tag>" }`              | Computed — call `resolveVersions(projects)` first, do not hand-build it |

### Worked Example

This assembles the input per the table above and passes it to `buildReadme`:

```js
import { load } from "js-yaml";
import { readFileSync } from "node:fs";
import {
  buildReadme,
  resolveVersions,
} from "./.claude/skills/update-readme/scripts/build-readme.mjs";

const readYaml = (file) => load(readFileSync(`profile/${file}`, "utf8"));

const identity = readYaml("identity.yaml").identity; // { legal, display } — pass through
const headlines = ["Distributed Systems", "Platform Engineering"]; // written for this run — see Summary
const location = readYaml("contact.yaml").contact.area; // area alone — never phone or location
const position = readYaml("experience.yaml").experience[0].roles[0].title; // current title
const summary = "Senior software engineer …"; // written for this run — see Summary
const projects = readYaml("projects.yaml").projects; // pass through
const media = readYaml("media.yaml").media; // pass through
const timeline = readYaml("timeline.yaml").timeline; // pass through
const headings = { summary: "Summary", projects: "Projects", media: "Links" };

const versions = await resolveVersions(projects);

const readme = buildReadme({
  identity,
  headlines,
  location,
  position,
  summary,
  projects,
  media,
  timeline,
  versions,
  headings,
});
```

## Process

Run these steps in order from this repository's root, and write nothing before step 7:

1. Read `profile/*.yaml` and `profile/CLAUDE.md`, and ask Jin Yu Zhang for the audience if the request names no purpose, posting, or audience
2. Resolve project versions with `resolveVersions(projects)`. Network failure is not fatal; a project without a version shows its stage instead
3. Write the summary and headlines for that audience per **Summary** above
4. Compose with `buildReadme(input)`, passing the `headings` object above. Experience is computed from `timeline.yaml` against today's date — never print a stated figure
5. Verify (advisory): check the composed prose against `profile/` before showing the diff. Call `verifyVerbatim(plan, readSourceText("profile"))` on a plain object of the fixed strings `buildReadme` wove into the README — at minimum `{ location, position, projectTitles: projects.map((p) => p.title), mediaLabels: media.map((m) => m.label) }`. The written summary and headlines never match a `profile/` string verbatim, so check them fact by fact instead: list each number, title, and claim it states beside the `profile/` value it comes from. The output is Markdown, so this check is advisory: report any misses alongside the diff in the next step, but never block the write on them. This is the opposite of `generate-resume`, where the same check's misses require explicit confirmation before rendering — the README has no page limit or background-check reader riding on it, so a miss here is a note, not a gate
6. Show the diff against the current `README.md`, plus the fact list for the summary and headlines and any misses from step 5
7. Write only on confirmation

## Scripts

`buildReadme` and `resolveVersions` are plain ESM library exports — they have **no command-line interface**. `verifyVerbatim` and `readSourceText` (the advisory check in step 5) come from the same module `generate-resume` uses. Call them from a small `.mjs` file, or with `node --input-type=module`, from this repository's root:

```js
import {
  buildReadme,
  resolveVersions,
} from "./.claude/skills/update-readme/scripts/build-readme.mjs";
import {
  verifyVerbatim,
  readSourceText,
} from "./.claude/skills/generate-resume/scripts/verify-verbatim.mjs";

const versions = await resolveVersions(input.projects);
const readme = buildReadme({ ...input, versions, headings });

const check = verifyVerbatim(plan, readSourceText("profile")); // advisory — see Process step 5
```

## Constraints That Must Never Break

Each constraint holds on every run, whatever the request asks:

- **Never Hand-Edit `README.md`**: Change `profile/` and regenerate
- **Never Invent Section Headings**: Use the fixed `headings` object above
- **Never Print Contact Details**: [`profile/CLAUDE.md`](../../../profile/CLAUDE.md) restricts `contact.yaml`'s `phone` and `location` to the resume document
- **Never State a Fact Outside `profile/`**: The summary is new each run, but every fact in it is one `profile/*.yaml` holds
