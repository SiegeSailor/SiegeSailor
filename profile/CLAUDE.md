# CLAUDE.md

The single source of truth for:

- Generated resume PDFs
  - [`generate-resume`](../.claude/skills/generate-resume/SKILL.md)
- [GitHub `README.md`](https://github.com/SiegeSailor/SiegeSailor)
  - [`.claude/skills/update-readme`](../.claude/skills/update-readme/SKILL.md)
- [Website facts](https://github.com/SiegeSailor/Website)
  - [`.claude/skills/update-website`](https://github.com/SiegeSailor/Website/blob/main/.claude/skills/update-website/SKILL.md)

> [!note]
> Read [`POLICY.md`](./POLICY.md) before rendering anything from this folder. It states the judgment calls that the file contents alone do not show.

## Shape

One file per subject. Each holds exactly one top-level key. What appears in a given document is decided per run by the skill rendering it, not by a flag stored here. Inline comments carry the reasoning behind a fact.
