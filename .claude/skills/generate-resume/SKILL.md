---
name: generate-resume
description: Use when generating or tailoring a resume for a job posting, an application, or a stated audience, including requests naming a page limit or required sections.
---

# Generate Resume

Renders a resume from `profile/` for a specific requirement. The model chooses
what appears; code guarantees that what appears is what the source says.

## Inputs

| Input | Default |
| --- | --- |
| Page limit | 1 |
| Target audience | ask if not given |
| Required sections | none beyond Summary, Skills, Work Experience |
| Posting or requirement text | optional |

Output lands in the working directory. No run history is kept — this skill
always reads the current `profile/`, which is local to this repository.

## Process

1. Read `profile/*.yaml`, `profile/POLICY.md`, and `reference/layout.md`.
2. Build a plan — ordered sections, and for each the exact strings selected
   from `profile/`. Copy strings; do not retype or rephrase them.
3. Verify: `verifyVerbatim(plan, readSourceText("profile"))`. Any miss is
   reported beside its nearest source match, and requires explicit
   confirmation before rendering. Never confirm on the user's behalf.
4. Render: `buildResume(plan, outputDir)`.
5. Check: `checkPages(docx, outputDir, pageLimit)`.
   - `ok` — report the path and the page count.
   - `over` — drop selections per `reference/layout.md` and re-render.
   - `unverified` — say the page count was **not** checked, and why. Never
     report success for an unverified document.

## Constraints That Must Never Break

- **Never print a string absent from `profile/` without confirmation** — the
  verifier exists because a background-check vendor reads these facts
- **Never violate `POLICY.md`** — it holds the judgment calls that the YAML
  alone does not show
