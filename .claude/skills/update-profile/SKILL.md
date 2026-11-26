---
name: update-profile
description: Use whenever a fact in profile/ is added, changed, or removed, or when asked to sync or publish profile facts to the README, the website, the resume, the cover letter, or LinkedIn.
---

# Update Profile

Carries a change to Jin Yu Zhang's profile facts to every output in one pass: it asks for the audience once, shows every change in one review, writes only what he approves, and emails him the result.

This skill owns the order, the review, LinkedIn, and the email. It does not own how an output is rendered — each output's own skill does, and this skill follows it:

| Output                  | Written In                | Skill Followed                                   |
| ----------------------- | ------------------------- | ------------------------------------------------ |
| Email                   | —                         | **Email** below                                  |
| GitHub `README.md`      | `SiegeSailor/SiegeSailor` | [`update-readme`](../update-readme/SKILL.md)     |
| LinkedIn profile        | —                         | **LinkedIn** below                               |
| Resume and cover letter | `SiegeSailor/SiegeSailor` | [`generate-resume`](../generate-resume/SKILL.md) |
| Website                 | `SiegeSailor/website`     | [`update-website`](../update-website/SKILL.md)   |

## Before Starting

1. **Find the website checkout.** `update-website` says how: it is the folder holding `source/settings/content.ts`, beside this repository or in a folder connected to the session. Ask for a path when it is missing; never clone over a local checkout, because unpushed work lives there.
2. **Read the rules.** Read `profile/CLAUDE.md`, and the website checkout's `CLAUDE.md` and `.claude/rules/*.md`, which do not load in a session opened here; their rules bind every step.
3. **Check the tools.** LinkedIn needs the Claude in Chrome extension; the email needs the Gmail connector. Name any that is missing now, and leave its output out of the run rather than substituting another route.

## Overrides

Where this skill and a repository skill disagree, these win, and only during a run of this skill:

- **Ask for the Audience Once**: Ask Jin Yu Zhang once for the audience, and for a posting, page limit, or required sections if the resume needs them, then pass the answer to every output. Run on its own, each repository skill still asks for its own
- **Hold Every Write until the Review**: Run each repository skill only up to the step where it would show its diff or ask for confirmation, keep what it composed, and write nothing until **Review** below is approved

## Process

### 1. Facts

`profile/CLAUDE.md` forbids changing a fact without explicit confirmation, so this is a gate of its own, before anything is rendered:

1. Write the requested change as a diff of `profile/*.yaml`. If Jin Yu Zhang already edited `profile/`, the diff is `git diff HEAD -- profile/`
2. Show it and wait for approval; no fact changes on an inferred or implied yes
3. On approval, write it and commit it in SiegeSailor with the `conventions:commit` skill, and keep the SHA for the website's header. Do not push

### 2. Compose

Compose every output without writing any of them:

| Output            | What to Compose                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| README            | `update-readme` through its verify step: the new `README.md` string and its fact list                          |
| Website           | `update-website` through its copy step: the new `settings/content.ts` and its fact list                        |
| Resume and Letter | `generate-resume` through `verifyVerbatim`: the plan and the letter, with any misses, but no `.docx` built yet |
| LinkedIn          | **LinkedIn** below, through its read step: each field's current value beside its proposed value                |
| Email             | **Email** below: the subject, the recipient, and the list of sections and attachments it will carry            |

### 3. Review

Show everything in one message, in this order, then wait:

1. **README**: the unified diff against the current `README.md`, then its fact list and any misses
2. **Website**: the unified diff of `source/settings/content.ts`, then its fact list
3. **Resume**: the whole content, section by section as it will print, with any `verifyVerbatim` misses marked
4. **Cover Letter**: the whole letter as it will print
5. **LinkedIn**: 1 row per field that changes, current beside proposed; unchanged fields are listed by name only
6. **Email**: the recipient, the subject, and what it will carry

Jin Yu Zhang may approve all, approve some, or ask for edits. An edit re-composes only that output and re-shows only that part. A `verifyVerbatim` miss on the resume still needs his explicit confirmation, as `generate-resume` requires.

### 4. Apply

Apply only the approved outputs, in this order, so the email can report every result:

1. **README**: write `README.md`
2. **Website**: write `source/settings/content.ts`, then run the rest of `update-website` — its structural step and its verification, `npm run typecheck && npm run lint && npm run build`
3. **Resume and Letter**: build both with `generate-resume`, and run `checkPages`. If a document overflows its page limit, cut content per that skill and show the changed content again before going on
4. **LinkedIn**: apply per **LinkedIn** below
5. **Email**: send per **Email** below

One output failing never stops the others; record the failure and carry it into the email. Leave the README and website commits to Jin Yu Zhang, and offer them with the `conventions:commit` skill at the end.

## LinkedIn

LinkedIn is edited through the Claude in Chrome extension, in Jin Yu Zhang's own Chrome session. The profile is `media.yaml`'s `linkedin` entry.

### Session

Open the profile in a new tab. If LinkedIn shows a sign-in page, a checkpoint, or a CAPTCHA, stop, ask Jin Yu Zhang to sign in or finish it in that tab, and wait for him to say it is done before going on. Never type a password or a verification code, and never sign out.

### Read

Read each field this skill may write, as it stands: the headline, the location, the About section, every Experience entry, every Education entry, every Project, the Skills, and the Licenses & Certifications. These current values are what **Review** shows on the left.

### Compose

The proposed values come from `profile/` under the same rules as every other output:

- **Write the Copy for the Audience**: The headline and the About section are written per run, from facts in `profile/` only, like the README summary
- **Keep Contact Details Off**: `contact.yaml`'s `phone` and `location` never go on LinkedIn; the location field takes its `area`
- **Keep 1 Entry per Title**: Each title in `experience.yaml` is its own Experience position with its own dates, grouped under its company the way LinkedIn groups them; never merge 2 titles into 1 widened range, and never drop 1
- **Print 1 Title per Entry**: An entry takes exactly 1 of a role's titles and its `alternativeTitles`, chosen for the audience, never 2 stacked
- **Projects Follow the Site**: Only `Production` and `Development` projects appear, as on the README and the website
- **Render Facts as Written**: Dates, titles, numbers, and rankings are copied, never reworded into a different claim

### Apply

Edit only the fields **Review** approved, 1 at a time: open its edit form, replace the value, save, and read the field back to confirm it took. When an edit dialog offers to notify the network, turn it off unless Jin Yu Zhang asked otherwise. Never post, message, connect, endorse, or change a setting outside the profile fields above. If a form does not match what is expected, stop on that field, report it, and go on to the next.

## Email

Send 1 email through the Gmail connector after **Apply**, so it reports what actually happened:

| Part        | Value                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------- |
| To          | `siegesailor@gmail.com`                                                                     |
| Subject     | `Profile update, <today>: <the fact change in a few words>`                                 |
| Body        | HTML, 1 section per output below, each saying applied, declined, skipped, or failed and why |
| Attachments | Every file written or generated, read and base64-encoded from disk, never re-typed          |

The body's sections:

1. **Changed Facts**: the approved `profile/` diff and its commit SHA
2. **README**: the link `https://github.com/SiegeSailor`, its diff, and a note that it is live once SiegeSailor is pushed
3. **Website**: the link from `content.ts`'s `SITE.domain`, the `content.ts` diff, and a note that it is live once website is pushed and deployed
4. **Resume and Cover Letter**: the files attached, and the audience they were written for
5. **LinkedIn**: the profile link, and each field changed, before and after

Attach `README.md`, `source/settings/content.ts`, the `profile/` diff as `profile.diff`, and the resume and cover letter as `.docx` and `.pdf`. Leave out any output that was not applied, and say so in its section.

## Constraints That Must Never Break

- **Never Write before Its Review**: No fact, file, LinkedIn field, or email changes before Jin Yu Zhang approves it — the facts at **Facts**, everything else at **Review**
- **Never Push or Deploy**: Pushing SiegeSailor or website is Jin Yu Zhang's call
- **Never Put Contact Details Where They Do Not Belong**: `phone` and `location` stay on the resume, per `profile/CLAUDE.md`
- **Never State a Fact Outside `profile/`**: Every output's written copy is new each run, but every fact in it is one `profile/*.yaml` holds
