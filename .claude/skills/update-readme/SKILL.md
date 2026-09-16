---
name: update-readme
description: Use when updating, syncing, or regenerating the GitHub profile README from profile facts.
---

# Update README

Regenerates this repository's `README.md` — the GitHub profile README — from
`profile/`.

## Headings

The three section titles are fixed, not sourced from `profile/` (its
`heading:` keys were deleted when `profile/` was migrated):

```
{ summary: "Summary", projects: "Projects", media: "Links" }
```

Pass this object as `headings` to `buildReadme`. Never invent different
titles.

## Process

1. Read `profile/*.yaml` and `profile/POLICY.md`.
2. Resolve project versions with `resolveVersions(projects)`. Network failure
   is not fatal; a project without a version shows its stage instead.
3. Compose with `buildReadme(input)`, passing the `headings` object above.
   Experience is computed from `timeline.yaml` against today's date — never
   print a stated figure.
4. Show the diff against the current `README.md`.
5. Write only on confirmation.

## Scripts

`buildReadme` and `resolveVersions` are plain ESM library exports — they have
**no command-line interface**. Call them from a small `.mjs` file, or with
`node --input-type=module`, from this repository's root:

```js
import { buildReadme, resolveVersions } from "./.claude/skills/update-readme/scripts/build-readme.mjs";

const versions = await resolveVersions(input.projects);
const readme = buildReadme({ ...input, versions, headings });
```

## Constraints That Must Never Break

- **Never print contact details** — `POLICY.md` restricts the phone number and
  postal area to the resume document
- **Never hand-edit `README.md`** — change `profile/` and regenerate
- **Never invent section headings** — use the fixed `headings` object above
