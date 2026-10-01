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

## Input Shape

`buildReadme` destructures exactly 8 fields. Every field but `versions` and `headings` is read straight out of `profile/`, and most are passed through as-is — but `summary` is the one field that needs unwrapping before it reaches `buildReadme`: `summary.yaml` stores its value as `[{ text: ... }]` (an array of objects, so a comment can sit beside each variant), while `buildReadme` calls `.trim()` directly on `summary` and requires a **bare string**. Passing the array or an object through unchanged breaks the build, so read this table rather than rediscovering the mismatch in `build-readme.mjs`.

| Field      | Source                                           | Shape `buildReadme` Needs                                 | Unwrap Needed?                                                          |
| ---------- | ------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `headings` | not from `profile/`                              | `{ summary, projects, media }`                            | Fixed — the literal object in **Headings** above, never invented        |
| `identity` | `identity.yaml`'s `identity:` key                | `{ legal, display }`                                      | No — pass through; only `.display` is read                              |
| `media`    | `media.yaml`'s `media:` key                      | `[{ key, label, href }, ...]`                             | No — pass through                                                       |
| `profile`  | `profile.yaml`'s `profile:` key                  | `{ headlines: string[], status: { location, position } }` | No — pass through                                                       |
| `projects` | `projects.yaml`'s `projects:` key                | `[{ title, href, stage, description }, ...]`              | No — pass through (`description` is read but unused by the README)      |
| `summary`  | `summary.yaml`'s `summary:` key, **first entry** | bare `string`                                             | **Yes** — take `summary[0].text`, not the array                         |
| `timeline` | `timeline.yaml`'s `timeline:` key                | `{ start, excluded: [{ start, end }, ...] }`              | No — pass through                                                       |
| `versions` | not from `profile/`                              | `{ "<owner>/<repo>": "<tag>" }`                           | Computed — call `resolveVersions(projects)` first, do not hand-build it |

### Worked Example

This assembles the input from `profile/` per the table above and passes it to `buildReadme`.

```js
import { load } from "js-yaml";
import { readFileSync } from "node:fs";
import {
  buildReadme,
  resolveVersions,
} from "./.claude/skills/update-readme/scripts/build-readme.mjs";

const readYaml = (file) => load(readFileSync(`profile/${file}`, "utf8"));

const identity = readYaml("identity.yaml").identity; // { legal, display } — pass through
const profile = readYaml("profile.yaml").profile; // { headlines, status, ... } — pass through
const summary = readYaml("summary.yaml").summary[0].text; // unwrap: [{ text }] -> string
const projects = readYaml("projects.yaml").projects; // pass through
const media = readYaml("media.yaml").media; // pass through
const timeline = readYaml("timeline.yaml").timeline; // pass through
const headings = { summary: "Summary", projects: "Projects", media: "Links" };

const versions = await resolveVersions(projects);

const readme = buildReadme({
  identity,
  profile,
  summary,
  projects,
  media,
  timeline,
  versions,
  headings,
});
```

## Process

Run these steps in order from this repository's root, and write nothing before step 6.

1. Read `profile/*.yaml` and `profile/CLAUDE.md`
2. Resolve project versions with `resolveVersions(projects)`. Network failure is not fatal; a project without a version shows its stage instead
3. Compose with `buildReadme(input)`, passing the `headings` object above. Experience is computed from `timeline.yaml` against today's date — never print a stated figure
4. Verify (advisory): check the composed prose against `profile/` before showing the diff. Build a plain object of the strings `buildReadme` wove into the README — at minimum `{ summary, headlines: profile.headlines, projectTitles: projects.map((p) => p.title), mediaLabels: media.map((m) => m.label) }` — and call `verifyVerbatim(plan, readSourceText("profile"))`. The output is Markdown, so this check is advisory: report any misses alongside the diff in the next step, but never block the write on them. This is the opposite of `generate-resume`, where the same check's misses require explicit confirmation before rendering — the README has no page limit or background-check reader riding on it, so a miss here is a note, not a gate
5. Show the diff against the current `README.md`, plus any misses from step 4
6. Write only on confirmation

## Scripts

`buildReadme` and `resolveVersions` are plain ESM library exports — they have **no command-line interface**. `verifyVerbatim` and `readSourceText` (the advisory check in step 4) come from the same module `generate-resume` uses. Call them from a small `.mjs` file, or with `node --input-type=module`, from this repository's root:

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

const check = verifyVerbatim(plan, readSourceText("profile")); // advisory — see Process step 4
```

## Constraints That Must Never Break

Each constraint holds on every run, whatever the request asks.

- **Never Hand-Edit `README.md`**: Change `profile/` and regenerate
- **Never Invent Section Headings**: Use the fixed `headings` object above
- **Never Print Contact Details**: [`profile/CLAUDE.md`](../../../profile/CLAUDE.md) restricts the phone number and postal area to the resume document
