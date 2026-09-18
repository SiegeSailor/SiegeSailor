# CLAUDE.md — profile

The single source of truth for the resume document, the GitHub README, and the
website. Nothing a reader sees is hard-coded in a consumer.

Read [`POLICY.md`](./POLICY.md) before rendering anything from this folder. It
states the judgment calls that the file contents alone do not show.

## Shape

One file per subject. Each holds exactly one top-level key and no routing
metadata — there are no `consumers:`, `heading:`, or `archived:` keys. What
appears in a given document is decided per run by the skill rendering it, not
by a flag stored here.

Inline comments carry the reasoning behind a fact. Preserve them.

## Who Reads This

| Reader            | Lives in                                                  |
| ----------------- | --------------------------------------------------------- |
| `update-readme`   | `.claude/skills/update-readme/` in this repository        |
| `generate-resume` | `.claude/skills/generate-resume/` in this repository      |
| `update-website`  | `.claude/skills/update-website/` in `SiegeSailor/Website` |

## Constraint That Must Never Break

- **The facts here are verified** — see [`POLICY.md`](./POLICY.md#changes)
