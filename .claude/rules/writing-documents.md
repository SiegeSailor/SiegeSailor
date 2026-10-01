---
paths:
  - "**/README.md"
  - "**/CONTRIBUTING.md"
  - "**/CLAUDE.md"
  - ".claude/**/*.md"
---

# Writing Documents

Every document in this repository follows these rules, according to its audience and purpose below:

| Document                 | Audience | Purpose                             |
| ------------------------ | -------- | ----------------------------------- |
| `.claude/rules/*.md`     | Agent    | What are the relevant rules?        |
| `.claude/skills/**/*.md` | Agent    | What can I reuse deterministically? |
| `**/CLAUDE.md`           | Agent    | What must I follow for this scope?  |
| `**/CONTRIBUTING.md`     | Human    | How do I work on this scope?        |
| `**/README.md`           | Human    | What is the scope about?            |
| `CLAUDE.md`              | Agent    | What must I follow?                 |
| `CONTRIBUTING.md`        | Human    | How do I contribute?                |
| `README.md`              | Human    | What is this?                       |

> [!important]
> When an agent is about to edit, it can ignore documents that target humans, but it must still write every document in a human-readable way. An agent only needs to read and update the documents that target humans when the change concerns their human-readable content (see **Purpose** above).

If a fact belongs to multiple documents across scopes, we should move it to `.claude/rules/*.md` and link to it from the other documents. If a fact is shared within a scope's documents, we should state it in `CLAUDE.md` and have other documents link to it. Before adding a paragraph anywhere, check that it is not already written down: `grep -rn "<phrase>" --include="*.md"`, and make sure it never contradicts another document.

## Writing Style

Follow these styles strictly, and prompt the user if any of them conflicts with the content you are writing:

- **Adopt GitHub Markdown**: Use GitHub Markdown syntax, e.g., `> [!important]`
- **Apply Title Case for Headings**: Headings, table headers, and list headers are always in title case
- **Avoid Newlines**: Only use a newline to separate paragraphs; let text wrap naturally
- **Comply with Terminology**: Use consistent terms and their variants as described in [Terminology](#terminology)
- **Fence Code Blocks**: Tag code blocks with the correct language, e.g., `shell` for terminal commands
- **Follow Heading Patterns**: Same pattern for headers in a list or a table, e.g., Do Foo, Amazing Bar
- **Format Items**: Use tables when 3 or more items share the same shape, a list when they do not
- **Give Minimum Context**: For heading level 1, 2, and 3, give at least 1 sentence of context after the title
- **Link with Relative Paths**: Write relative links when linking to another file, and check that each one resolves
- **Mention File Location**: State what the filename and location are when it matters
- **Order Alphabetically**: Lists, tables, and ordered content should follow alphabetical order when applicable
- **State Only the Necessary**: No summary of what the document just said, no conclusion, and no restating a heading
- **Use Actual Numbers**: Use actual numbers instead of words like three, five, e.g., 2 dogs, 7 birds
- **Use Backticks for URLs**: Write a bare URL as `https://example.com`, and link it when it has link text. No raw HTML
- **Use Colons for Items**: Use a colon at the end of a description if the next line is a list, table, or code block
- **Use Double Quotes**: Use double quotes when applicable
- **Use Periods only for Paragraphs**: Headings, lists, and tables do not end with a period

> [!important]
> This file itself is the example of the documentation style. Ensure all documents look similar to this.

### Terminology

Use each term exactly as written, and treat its variants as the same term:

| Term                 | Variants |
| -------------------- | -------- |
| ACM                  |          |
| Article              |          |
| AWS                  |          |
| CloudFront           |          |
| Conventional Commits |          |
| ESLint               |          |
| GitHub               |          |
| HeroUI               |          |
| Husky                |          |
| JavaScript           |          |
| Markdown             | MD       |
| Next.js              |          |
| Node.js              |          |
| NPM                  |          |
| poppler              |          |
| Prettier             |          |
| Route 53             |          |
| S3                   |          |
| Semantic Release     |          |
| Terraform            |          |
| TFLint               |          |
| TypeScript           |          |
| YAML                 | YML      |

> [!note]
> When you find a repeated term, prompt the user for confirmation before adding it to this table. If you find 2 similar terms, prompt the user to clarify, correct them to use the same term, and add it to this table.
