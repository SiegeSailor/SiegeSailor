# Resume Layout

Format rules for the rendered document. Content rules live in [`profile/CLAUDE.md`](../../../../profile/CLAUDE.md).

## Hard Constraints

Every rendered document meets these constraints, and a request can override only the page limit:

- **Align Dates with a Tab**: Right-align dates with a right tab stop and a literal tab in the run, never with spaces, because LibreOffice ignores the docx `PositionalTab`
- **Emit Native Bullets**: Never emit a literal `•`; bullets come from the numbering configuration as native Word bullets
- **Limit to 1 US-Letter Page**: The document fits 1 US-Letter page unless the request overrides the limit
- **Stay ATS-Safe**: Use a single column, with no tables, text boxes, headers, or footers
- **Treat the `.docx` as Primary**: The `.docx` is the deliverable, and the `.pdf` is only a convenience
- **Use Calibri**: Set every run in Calibri, with sizes in half-points and spacing and indents in twips

## Section Names

Use exactly these, because ATS parsers match on them:

`Summary`, `Skills`, `Work Experience`, `Publications`, `Education`, `Certifications`, `Activities`

## Section Order

The order above is the default and is ATS-sensitive. Reorder only when the request gives a reason, and never move `Work Experience` below `Education` for a role requiring professional experience.

## Fitting 1 Page

Spacing is already tight, so fit by dropping content, not by shrinking type. Drop in this order:

1. `Activities`, then `Publications`, unless the audience is academic
2. The bullets you ranked least relevant to the stated audience when composing the plan, taken from the oldest roles first
3. Company blurbs
4. Whole roles older than 10 years, subject to the employment-history rules in [`profile/CLAUDE.md`](../../../../profile/CLAUDE.md)
