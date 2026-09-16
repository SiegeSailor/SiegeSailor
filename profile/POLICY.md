# POLICY

The judgment calls behind the facts in this folder. Every skill that renders
this content reads this file first. These are not style preferences — each one
exists because getting it wrong misrepresents a verified record.

## Employment History

- **StageSource and DY Game each appear in two files, and must render in only
  one place.** Both are present in `experience.yaml` (with their own bullets,
  alongside the real jobs) and in `education.yaml` (as a detail under the
  degree each belongs to). This is not an error to reconcile — it is how the
  source data is organized. When rendering any document, take StageSource and
  DY Game **only** from their education detail, and never emit them as
  Work Experience entries. Never render the same entry in both sections of one
  document.
- **StageSource is not employment.** It was a Boston University course team
  working a real client's requirements. It prints as a detail of the M.S.,
  never in a work-experience section. No employment-verification vendor should
  be sent after a job that was never one.
- **DY Game is not employment.** An internship taken during the B.F.A. It
  prints under that degree, on the same reasoning.
- **Never widen Servicetech's range.** The 2017–2018 role and the 2016–2017
  internship are separate lines. Print the internship as its own line or omit
  it; never absorb it into a single 2016–2018 range.
- **Never flatten stacked role lines.** CooperSurgical and Servicetech each
  keep one line per title. Background-check vendors verify titles and dates
  separately, so a widened range reads as a discrepancy. This forbids
  *widening or merging* a range — printing two titles as if they were one,
  with a single combined range covering both. It does not mandate printing
  every title: per the rule above, the 2016–2017 Servicetech internship line
  may be omitted entirely for space. Omitting a role outright and widening
  its neighbor's range are different acts — the first drops a line, the
  second misstates one that stays — and only the second is forbidden here.
- **Never drop a role to make room while keeping a more junior one from the
  same employer.** That reads as an unexplained gap in the record.

## Claims

- **The Shopee retention figure is first-to-last-day within a single 3–14 day
  festival run.** It is not D1 or D7 cohort retention. Never compress it to
  "player retention" — the window is the claim.
- **Contact details are document-only.** The phone number and postal area in
  `contact.yaml` belong on the resume document. They never appear on the
  website or in the README.

## Changes

- **Every fact here is verified.** No date, title, ranking, or number changes
  without explicit confirmation from Ken. This is the folder a background-check
  vendor is effectively reading. This binds output as well as source: render
  every fact as written here, in every generated document. Rewording a
  verified fact into a punchier or different claim — a placement, a score, a
  percentage, a range — needs Ken's explicit confirmation just as much as
  editing the file would.
