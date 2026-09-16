# Resume Layout

Format rules for the rendered document. Content rules live in
[`profile/POLICY.md`](../../../../profile/POLICY.md).

## Hard Constraints

- One US-Letter page unless the request overrides the limit.
- ATS-safe: single column; no tables, text boxes, headers, or footers.
- Never emit a literal `•`. Bullets come from the numbering configuration as
  native Word bullets.
- Dates are right-aligned with a right tab stop and a literal tab in the run,
  never with spaces. LibreOffice ignores the docx `PositionalTab`.
- Calibri. Sizes in half-points; spacing and indents in twips.
- The `.docx` is the primary deliverable; the `.pdf` is a convenience.

## Section Names

Use exactly these, because ATS parsers match on them:

`Summary`, `Skills`, `Work Experience`, `Publications`, `Education`,
`Certifications`, `Activities`

## Section Order

The order above is the default and is ATS-sensitive. Reorder only when the
request gives a reason, and never move `Work Experience` below `Education` for
a role requiring professional experience.

## Fitting One Page

Spacing is already tight, so fit by dropping content, not by shrinking type.
Drop in this order:

1. `Activities`, then `Publications`, unless the audience is academic
2. The bullets you ranked least relevant to the stated audience when
   composing the plan, taken from the oldest roles first
3. Company blurbs
4. Whole roles older than ten years, subject to `POLICY.md`

Dropping a role is also subject to `profile/POLICY.md`'s employment-history
rules.
