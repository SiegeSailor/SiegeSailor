---
name: generate-resume
description: Use when generating or tailoring a resume for a job posting, an application, or a stated audience, including requests naming a page limit or required sections.
---

# Generate Resume

Renders a resume from `profile/` for a specific requirement. The model chooses what appears; code guarantees that what appears is what the source says.

## Inputs

Use the value the request gives for each input, and the default when it gives none:

| Input                       | Default                                      |
| --------------------------- | -------------------------------------------- |
| Page Limit                  | 1                                            |
| Posting or Requirement Text | optional                                     |
| Required Sections           | none beyond Summary, Skills, Work Experience |
| Target Audience             | the posting's, or ask if neither is given    |

Output lands in the working directory. No run history is kept — this skill always reads the current `profile/`, which is local to this repository.

## Scripts

`verifyVerbatim`, `readSourceText`, `buildResume`, and `checkPages` are plain ESM library exports — they have **no command-line interface**. There is nothing to run as `node some-script.mjs arg1 arg2`; call them from a small `.mjs` file, or with `node --input-type=module`, from this repository's root, after `npm install` has been run here:

| Export                             | Path                                                         |
| ---------------------------------- | ------------------------------------------------------------ |
| `buildResume`                      | `.claude/skills/generate-resume/scripts/build-resume.mjs`    |
| `checkPages`                       | `.claude/skills/generate-resume/scripts/check-pages.mjs`     |
| `verifyVerbatim`, `readSourceText` | `.claude/skills/generate-resume/scripts/verify-verbatim.mjs` |

```js
import {
  verifyVerbatim,
  readSourceText,
} from "./.claude/skills/generate-resume/scripts/verify-verbatim.mjs";
import { buildResume } from "./.claude/skills/generate-resume/scripts/build-resume.mjs";
import { checkPages } from "./.claude/skills/generate-resume/scripts/check-pages.mjs";

const verify = verifyVerbatim(plan, readSourceText("profile"));
// confirm any misses with the user before continuing, then:
const docx = await buildResume(plan, outputDir);
const check = checkPages(docx, outputDir, plan.pageLimit ?? 1);
```

## Plan Schema

A plan is a plain object. `verifyVerbatim` walks every scalar leaf of it and rejects any string it cannot find in `profile/*.yaml`, except `audience` and `pageLimit` themselves (an object or array placed under either name is still walked). `heading` must be one of the exact names in `reference/layout.md`; `key` selects the builder in `build-resume.mjs` and must be one of `summary`, `skills`, `experience`, `publications`, `education`, `certifications`, `activities`. Every string inside a section — bullets, details, publication and activity items included — is a bare string, not `{ text: ... }`, even though it is stored that way in `profile/*.yaml`: pull `.text` out when copying:

```text
{
  pageLimit: number,
  audience: string,                    // free text, not checked against profile/
  identity: { legal: string, display: string },
  contact: { line1: string, line2: string },
  sections: [
    { key: "summary", heading: "Summary", text: string },   // written for the audience

    { key: "skills", heading: "Skills",
      rows: [{ label: string, items: string }, ...] },

    { key: "experience", heading: "Work Experience",
      entries: [{
        company: string, location: string, blurb: string,   // blurb optional
        roles: [{ title: string, dates: string }, ...],
        bullets: [string, ...],
      }, ...] },

    { key: "publications", heading: "Publications",
      items: [string, ...] },

    { key: "education", heading: "Education",                // certifications: same shape
      entries: [{
        school: string, degree: string, dates: string,
        details: [string, ...],                               // optional
      }, ...] },

    { key: "activities", heading: "Activities",
      items: [string, ...] },
  ],
}
```

## Worked Example

This plan selects the content the pre-port pipeline printed, less 1 Edallianz bullet dropped to stay on 1 page once the CooperSurgical library bullet grew. It is known to work: it passes `verifyVerbatim` against the current `profile/` and renders at 1 page, 612×792 pts:

```json
{
  "pageLimit": 1,
  "audience": "the same content the current document prints",
  "identity": { "legal": "Jin Yu Zhang", "display": "Jin Yu Zhang" },
  "contact": {
    "line1": "NYC Metropolitan Area |  857-540-6713  |  siegesailor@gmail.com",
    "line2": "jinyu-zhang.com  |  linkedin.com/in/jin-yu-zhang-812181155  |  github.com/SiegeSailor"
  },
  "sections": [
    {
      "key": "summary",
      "heading": "Summary",
      "text": "Senior software engineer bridging across distributed systems, hardware, and firmware. Architected a device SDK over gRPC with C++, Python, .NET, and Node.js clients, reused across 5+ products under FDA and EU MDR. Sustained 10,000+ peak RPS and 200,000+ daily players at Shopee. Led a team of 5, and a shared component library built with 4+ vendors and used by 20+ developers."
    },
    {
      "key": "skills",
      "heading": "Skills",
      "rows": [
        {
          "label": "Languages",
          "items": "C#, TypeScript / JavaScript (Node.js), Python, C++, Bash, SQL"
        },
        {
          "label": "AI Engineering",
          "items": "Agentic coding (Claude Code), LLM pipelines in CI/CD, knowledge-graph extraction, LLM observability (Langfuse)"
        },
        {
          "label": "Distributed Systems",
          "items": "gRPC, Protocol Buffers, RabbitMQ, Socket.IO / WebSocket, REST, microservices, concurrent & real-time systems, Zeroconf"
        },
        {
          "label": "Cloud & DevOps",
          "items": "Docker, Kubernetes, GitLab CI/CD, GitHub Actions, Terraform, AWS, GCP, Linux (Ubuntu, Debian), Nginx"
        },
        {
          "label": "Data & Frontend",
          "items": "MongoDB, MySQL, PostgreSQL, Redis; React.js, Next.js, Redux, Electron"
        },
        {
          "label": "Regulated Software",
          "items": "IEC 62304, ISO 13485, FDA & EU MDR compliance SDLC, DevSecOps"
        }
      ]
    },
    {
      "key": "experience",
      "heading": "Work Experience",
      "entries": [
        {
          "company": "CooperSurgical",
          "location": "NJ / MA / CT, USA",
          "blurb": "Medical device R&D — global IVF device leader operating in 130+ countries",
          "roles": [
            {
              "title": "Senior Software Engineer",
              "dates": "Jun 2025 – Present"
            },
            { "title": "Software Engineer", "dates": "Jan 2024 – Jun 2025" },
            {
              "title": "Software Engineering Intern",
              "dates": "May 2023 – Aug 2023"
            }
          ],
          "bullets": [
            "Architected a cross-product device SDK shipped as a Docker container (gRPC, MongoDB, RabbitMQ, Zeroconf) with .NET, Node.js, Python, and C++ clients, reused across 5+ FDA / EU MDR-regulated IVF products",
            "Cut RFID data-transition time by 90% with database caching and gRPC streaming, reducing environmental-data rendering time on device UIs by 50%",
            "Led a shared React.js component library and its automated quality workflow (ESLint, Jest, Semantic Release on GitLab CI), built by 8+ contributors from 5+ parties (CooperSurgical and 4+ vendors) and used by 20+ developers across 6+ products (on-device software and web applications)",
            "Built secure IVF workstation software on purpose-built embedded Linux — compliance-driven SDLC (IEC 62304 / ISO 13485), GitLab CI/CD pipelines, and containerized applications",
            "Integrated LLM-assisted engineering into R&D workflows: agentic coding tools, self-healing document generation in GitLab CI, knowledge-graph extraction, and LLM observability (Langfuse)"
          ]
        },
        {
          "company": "Shopee",
          "location": "Taipei, Taiwan",
          "blurb": "Leading Southeast Asian e-commerce platform, 300M+ annual active users",
          "roles": [
            {
              "title": "Software Engineer, Mobile Web Games",
              "dates": "Jan 2020 – Feb 2022"
            }
          ],
          "bullets": [
            "Built real-time multiplayer game services (Socket.IO, Express.js, Redis) sustaining 10,000+ peak RPS and 200,000+ daily players on low-end devices in weak-signal regions",
            "Raised first-to-last-day player retention from 0.25 to 0.65 across 3–14 day shopping-festival runs by designing a weighted-random reward algorithm",
            "Integrated regional data warehouses and deployment pipelines with global services on GCP under a TDD-enforced workflow, cutting local developers' redeployment effort by 90%+"
          ]
        },
        {
          "company": "Edallianz",
          "location": "Taipei, Taiwan",
          "roles": [
            { "title": "Software Engineer", "dates": "Jan 2019 – Nov 2019" }
          ],
          "bullets": [
            "Redesigned the payment endpoint flow from internal data-flow analysis, lifting checkout conversion by 25%"
          ]
        },
        {
          "company": "Servicetech International",
          "location": "Taichung, Taiwan",
          "roles": [
            { "title": "Software Engineer", "dates": "Jun 2017 – Nov 2018" }
          ],
          "bullets": [
            "Drove a paperless transformation — shipped a supply-chain PWA (Firebase, Ionic, React.js), consolidating 100+ ad-hoc sales channels into 6 trackable procedures"
          ]
        }
      ]
    },
    {
      "key": "education",
      "heading": "Education",
      "entries": [
        {
          "school": "Boston University",
          "degree": "M.S. in Computer Science (GPA 3.8 / 4.0)",
          "dates": "May 2022 – Jan 2024",
          "details": [
            "First author, “Quantitative DevSecOps Metrics for Cloud-Based Web Microservices,” IEEE Access, 2024",
            "3rd place, NCAE-C Cyber Games 2023 Northeast Division — Server Security Leader (infrastructure defense)",
            "Co-led a 6-member classmate team building an MVP SaaS prototype (Django, PostgreSQL, AWS) against live commercial requirements for StageSource, a Boston arts nonprofit"
          ]
        },
        {
          "school": "National Formosa University",
          "degree": "B.F.A. in Multimedia Design",
          "dates": "Sep 2013 – Jan 2017",
          "details": [
            "Game development intern at DY Game (2014), shipping a motion-sensing game title with a 30-person course cohort across its programming, art, and operations groups"
          ]
        }
      ]
    },
    {
      "key": "certifications",
      "heading": "Certifications",
      "entries": [
        {
          "school": "Massachusetts Institute of Technology",
          "degree": "Cert. in Data Science & Machine Learning (top 15 of 146)",
          "dates": "Aug 2023 – Nov 2023"
        },
        {
          "school": "New York University",
          "degree": "Certificate, Preparatory Course for Graduate Studies in Computing",
          "dates": "Jan 2022 – May 2022"
        }
      ]
    }
  ]
}
```

## Process

Run these steps in order from this repository's root:

1. Read `profile/*.yaml`, `profile/CLAUDE.md`, and [`reference/layout.md`](./reference/layout.md)
2. Build a plan per the schema above — ordered sections, and for each the exact strings selected from `profile/`. Write the summary for the audience per **Audience** in [`profile/CLAUDE.md`](../../../profile/CLAUDE.md); copy every other string, and do not retype or rephrase it
3. Verify: `verifyVerbatim(plan, readSourceText("profile"))`. Any miss is reported beside its nearest source match, and requires explicit confirmation before rendering. Never confirm on the user's behalf. The written summary is always a miss, so show it with each number, title, and claim it states beside the `profile/` value it comes from
4. Render: `buildResume(plan, outputDir)`
5. Check: `checkPages(docx, outputDir, pageLimit)`, then act on its status:

| Status       | Action                                                                                                                                                                                                                                                                                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ok`         | Report the path and the page count                                                                                                                                                                                                                                                                                                                                          |
| `over`       | Drop content per [`reference/layout.md`](./reference/layout.md), re-render, and re-run `checkPages`. Repeat at most 3 times total. If the document is still over the limit after 3 attempts, report that the page limit was **not met**, and say what was dropped at each attempt and why it still does not fit. Never report success for a document that exceeds the limit |
| `unverified` | Say the page count was **not** checked, and why. Never report success for an unverified document                                                                                                                                                                                                                                                                            |

## Constraints That Must Never Break

Each constraint holds on every run, whatever the request asks:

- **Never Print a String Absent from `profile/` without Confirmation**: The verifier exists because a background-check vendor reads these facts
- **Never Violate [`profile/CLAUDE.md`](../../../profile/CLAUDE.md)**: It holds the judgment calls that the YAML alone does not show
