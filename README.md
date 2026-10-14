# ERBM Frontend

Next.js frontend for the **Expense Reimbursement and Bill Management System (ERBM)** capstone project. The repository currently provides a minimal starter ready for application development.

## Product context

The documented workflow covers **Advance Request → Disbursement → Expense Recording → Closing / Reconciliation**. These are product requirements for future development; the current application provides the frontend scaffold.

| Role | Documented responsibility |
| --- | --- |
| PC — Project Coordinator | Create and revise advance requests, record expenses, and submit closing requests. |
| PM — Project Manager | Review advance requests, approve them, or return them with a reason. |
| Accounting | Confirm actual disbursement, review reconciliation, and confirm final closing. |
| MD | Sign the printed advance request outside the system in phase 1. |

See the [requirements guide](docs/requirements/README.md) for the documented business rules and open decisions, and the [original requirement analysis](docs/requirements/ERBM_Advance_Request_Requirement_Analysis.md) for the full flow. The analysis contains both requirements and recommendations; proposed status enums, permissions, and validation rules still need clarification.

## Authentication guidance

The current backend authentication API is documented in the [frontend authentication integration baseline](docs/integration/authentication.md). It covers login, refresh cookies, account activation, profile/role data, and open integration decisions. Frontend auth screens and session handling are not implemented yet.

The repository includes a frontend [authentication skill](.agents/skills/authentication/SKILL.md). Invoke it in Codex with `$authentication`, for example: `$authentication ช่วยทำหน้า login ให้ตรงกับ API ของ ERBM`. Shared instructions in `AGENTS.md` also point to this skill for auth tasks.

## Stack

- Next.js 16.4 with the App Router and Turbopack
- React 19.3 and TypeScript in strict mode
- Tailwind CSS 4
- ESLint with Next.js and TypeScript rules
- npm with `package-lock.json` for reproducible installs

## Getting started

Use Node.js 24 (see `.nvmrc`) and npm. Next.js requires Node.js 20.9 or newer.

```bash
# Optional, if you use nvm:
nvm use

npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edit `src/app/page.tsx` to change the home page; the development server reloads changes automatically.

## Commands

| Command             | Purpose                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| `npm run dev`       | Start the development server.                                             |
| `npm run build`     | Create a production build.                                                |
| `npm start`         | Serve the production build; run `build` first.                            |
| `npm run lint`      | Check source with ESLint.                                                 |
| `npm run typecheck` | Generate Next.js route types and check TypeScript without emitting files. |

To use a different port, run `npm run dev -- --port 3001`.

## Project structure

```text
src/app/
  globals.css          Global styles and Tailwind CSS import
  layout.tsx           Root document layout and page metadata
  page.tsx             Home page at /
docs/requirements/    Business requirements, source analysis, and open decisions
docs/integration/     Backend authentication contract and reference snapshot
.agents/skills/       Project skills, including frontend authentication
docs/superpowers/      Setup design and implementation plan
next.config.ts        Next.js configuration and Turbopack project root
postcss.config.mjs    Tailwind CSS PostCSS plugin
eslint.config.mjs     ESLint configuration
tsconfig.json         TypeScript configuration and @/* import alias
AGENTS.md             Shared instructions for coding agents
CLAUDE.md             Claude Code entry point for shared instructions
```

The `@/*` import alias resolves to `src/*`. Add static assets under `public/` when needed; Next.js serves them from the site root. App Router components run on the server by default. Add `"use client"` only when a component needs state, effects, event handlers, or browser APIs.

Tailwind CSS is compiled by `@tailwindcss/postcss`, configured in `postcss.config.mjs`. This starter uses system fonts and does not download fonts during a build.

Turbopack is the default bundler. If your environment restricts the local worker ports used by Turbopack, use the supported Webpack commands: `npm run dev -- --webpack` and `npm run build -- --webpack`.

## Environment variables

The starter does not require environment variables. Add local values to `.env.local` when integrating services. Environment files are ignored by Git. Prefix a variable with `NEXT_PUBLIC_` only when its value is intended to be visible in the browser; keep secrets on the server. Restart the development server after changing environment variables.

## Verification

Before submitting changes, run:

```bash
npm run lint
npm run typecheck
npm run build
```

There is no automated application test suite yet. Add focused tests alongside future application behavior. Linting runs separately from the production build.

As of October 14, 2026, `npm audit` reports five high-severity development dependency findings from the [unpatched `braces` advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) in the ESLint dependency chain. `npm audit --omit=dev` reports zero vulnerabilities. The suggested forced fix downgrades the Next.js ESLint configuration to an incompatible major version; retain the matching configuration and revisit when an upstream patch is available.

## References

- [Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
