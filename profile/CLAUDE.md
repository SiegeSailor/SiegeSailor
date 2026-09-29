# CLAUDE.md

The single source of truth for the following outputs. Every fact here is verified and effectively read by background-check vendors, so each rule below exists because getting it wrong misrepresents the record. Read this file before rendering anything from this folder:

| Output                                                           | Skill                                                                                                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [GitHub `README.md`](https://github.com/SiegeSailor/SiegeSailor) | [`update-readme`](../.claude/skills/update-readme/SKILL.md)                                                 |
| Resume documents                                                 | [`generate-resume`](../.claude/skills/generate-resume/SKILL.md)                                             |
| [Website](https://github.com/SiegeSailor/Website)                | [`update-website`](https://github.com/SiegeSailor/Website/blob/main/.claude/skills/update-website/SKILL.md) |

### Changes

- **Confirm Before Changing a Fact**: No date, title, ranking, or number in this folder changes without explicit confirmation from Ken
- **Render Facts as Written**: Rewording a fact into a punchier or different claim, such as a placement, a score, a percentage, or a range, needs the same confirmation as editing the file

### Claims

- **Keep Contact Details on the Resume**: The phone number and postal area in `contact.yaml` never appear on the website or in the README

### Employment History

- **Keep 1 Line per Title**: CooperSurgical and Servicetech list each title with its own dates because background-check vendors verify them separately; omitting a line, such as the 2016–2017 Servicetech internship, is allowed, but merging 2 titles into 1 widened range, such as a 2016–2018 Servicetech line, is not
- **Keep Senior Roles**: Never drop a role to make room while keeping a more junior one from the same employer, since that reads as an unexplained gap

## Shape

Each subject has 1 file holding exactly 1 top-level key. `verifyVerbatim` loads every file as 1 YAML document, so a top-level key must also be unique across files. What appears in a given document is decided per run by the skill rendering it, not by a flag stored here. Inline comments carry the reasoning behind a fact.
