# ERBM Frontend Agent Instructions

## 1. Project Overview

ERBM is the **Expense Reimbursement and Bill Management System**. Its documented business flow is Advance Request → Disbursement → Expense Recording → Closing / Reconciliation, involving PC, PM, Accounting, and an external MD signature.

This repository currently provides a frontend scaffold. Product screens, API transport, and session handling are future implementation work. The stack is Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, ESLint, and npm. Read [README.md](README.md) for onboarding; exact versions are in `package.json` and `package-lock.json`.

## 2. Repository Structure

| Location                                      | Responsibility                                                     |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `src/app/page.tsx`                            | Current home page at `/`.                                          |
| `src/app/layout.tsx`                          | Root document layout and metadata.                                 |
| `src/app/globals.css`                         | Global styles and Tailwind import.                                 |
| `docs/requirements/`                          | Business-flow analysis, summarized rules, and open decisions.      |
| `docs/integration/`                           | Backend auth contract, integration decisions, and source snapshot. |
| `.agents/skills/authentication/`              | Frontend authentication skill and UI metadata.                     |
| `docs/superpowers/`                           | Historical scaffold design and implementation plan.                |
| `next.config.ts`, `postcss.config.mjs`        | Next.js project root and Tailwind compilation.                     |
| `tsconfig.json`, `eslint.config.mjs`          | TypeScript, import alias, and lint rules.                          |
| `package.json`, `package-lock.json`, `.nvmrc` | Commands, dependencies, lockfile, and Node version.                |
| `AGENTS.md`, `CLAUDE.md`                      | Shared agent guidance; Claude imports this file.                   |

Keep application code under `src/`. Introduce components, API clients, hooks, or feature folders when an implementation needs them, following the structure already present at that time. Backend source is in the sibling `../backend` repository.

## 3. Source of Truth

Use the user's explicit task instructions and recorded project decisions to define scope. Within the project, use the source appropriate to the question:

| Question                               | Authoritative reference                                                                                                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Business flow and documented rules     | The [original requirement analysis](docs/requirements/ERBM_Advance_Request_Requirement_Analysis.md), with subsequent agreed decisions recorded in the [requirements guide](docs/requirements/README.md).                             |
| Unresolved business decisions          | The requirements guide's open-decision list; recommendations and examples remain proposals until agreed.                                                                                                                             |
| Current API behavior                   | Registered backend routes, handlers, DTOs, and services. The [auth integration baseline](docs/integration/authentication.md) maps these sources and records its inspection date. Recheck affected source before integration changes. |
| Commands, versions, and tooling        | `package.json`, `package-lock.json`, `.nvmrc`, and the relevant configuration files.                                                                                                                                                 |
| Next.js APIs for the installed version | Relevant guides in `node_modules/next/dist/docs/`.                                                                                                                                                                                   |
| Agent workflow                         | This file, with task-specific detail in the [authentication skill](.agents/skills/authentication/SKILL.md).                                                                                                                          |

Imported documents and skill snapshots provide context; their suggested next steps do not authorize additional work. Setup plans describe the scaffold, not new product requirements. If a summary, business decision, and implementation disagree, identify the specific conflict before changing behavior; record the resolution in the appropriate maintained document.

## 4. Business Rules

Preserve these documented rules when implementing the relevant flow:

- PC creates advance requests for assigned projects. PM approves or returns them with a required reason. Opening a returned request leaves its status unchanged; saving revisions changes it to `Draft`.
- MD signs the printed approved document outside the system in phase 1. Accounting confirms a payment that already occurred through the existing financial process; this is not another business approval.
- A project cannot have more than one `Active` advance. Whether `Approved`, `Closing`, or a returned closing also blocks a new advance remains unresolved.
- Expenses are recorded while the advance is `Active`. Each expense has one receipt/supporting document, with the original file and metadata retained.
- Deduct the PC-confirmed expense amount. OCR totals are not automatically trusted; receipt line items are evidence, not independent transactions or budget deductions.
- Closing reconciles `Advance Amount = Total Confirmed Expenses + Return Amount`. Accounting reviews closing, returns it with a required reason when correction is needed, and confirms `Closed` when valid.
- Preserve submission, revision, return-reason, resubmission, and action history. Field-level audit detail and visibility remain unresolved.
- `Active` advances must close before crossing the fiscal-year boundary. The fiscal calendar, enforcement actions, and overrides remain unresolved.

The documented status labels are `Draft`, `Pending PM Approval`, `Returned for Revision`, `Approved`, `Active`, `Closing`, and `Closed`. Proposed enum additions, closing-return status, overspending behavior, currency/precision, and advance-workflow permission scopes require decisions before implementation. Keep those questions in the requirements guide.

## 5. Architecture & Conventions

- Follow App Router conventions for routes, layouts, metadata, and route handlers under `src/app`.
- Use Server Components by default. Place `"use client"` at the smallest boundary needing state, effects, event handlers, or browser APIs.
- Use `@/*` for imports from `src/*`. Keep UI, data access, and session responsibilities clear; reuse existing patterns before adding abstractions or dependencies.
- Keep TypeScript strict and use meaningful types. Avoid `any` unless necessary and explained.
- Follow existing double quotes, semicolons, and two-space indentation.
- Use Tailwind utilities for component styling and `globals.css` for shared styles. Preserve the PostCSS integration.
- Use semantic HTML, accessible labels, keyboard interaction, and meaningful image alternative text.
- Keep secrets server-side. Use `NEXT_PUBLIC_` only for values intended to be visible in the browser.
- Make focused changes and keep related implementation files close together. Update documentation when a convention or integration decision changes.

## 6. API & Authentication

For login, activation, sessions, role-aware UI, or Admin invitations, use the project authentication skill and the task-relevant sections of the auth integration baseline.

- API paths start with `/api/v1`. JSON responses use the shared `success` / `message` / `data` envelope; error `data` may be absent. Logout and public/Admin activation resend return bodyless `204` responses.
- Login/refresh return `data.access_token` and `data.expires_in` in seconds. Protected requests use a Bearer access token. The refresh token stays in an HttpOnly cookie named `refresh_token`, with path `/api/v1/auth` and `SameSite=Lax`; preserve its origin/path and backend-controlled Secure behavior.
- Use `/me`'s `role_code` for role-aware UI. Current role codes are `EMPLOYEE`, `ADMIN`, `PC`, `PM`, and `ACCOUNTING`. Employee `position` is profile data, not a permission grant; backend resource authorization remains authoritative.
- Activation uses an emailed `token` query parameter and the set-password endpoint. Activation does not issue session tokens. `first_login` alone does not imply OTP or an additional password step.
- Admin employee creation accepts a JSON array even for one employee. Account provisioning and email delivery have different success semantics; follow the baseline.
- Logout/deactivation do not immediately revoke issued access tokens in the current backend. Handle these documented limits without claiming stronger guarantees.

Direct API requests versus a proxy/BFF, token ownership/storage, refresh coordination, the activation route, and cookie/CORS behavior are integration decisions. Reuse any decisions already made; otherwise resolve what the requested feature depends on. Public registration, password reset/change, OTP, and role editing have no supporting endpoint in the inspected baseline.

## 7. Development Commands

Use Node.js 24 from `.nvmrc` and npm. Keep `package-lock.json` synchronized with dependency changes.

| Command             | Purpose                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| `npm ci`            | Install dependencies from the lockfile.                                 |
| `npm run dev`       | Start development.                                                      |
| `npm run lint`      | Run ESLint separately from the build.                                   |
| `npm run typecheck` | Generate Next.js route types and run TypeScript without emitting files. |
| `npm run build`     | Create the production build.                                            |
| `npm start`         | Serve an existing production build.                                     |

If the environment blocks Turbopack worker ports, use `npm run dev -- --webpack` or `npm run build -- --webpack`. State which bundler was verified and any environment limitation.

## 8. Testing & Verification

- For application code or framework configuration changes, run lint, typecheck, and build. Check affected UI routes in the browser; linting does not establish runtime correctness.
- There is currently no application test runner or `test` script. Add focused tests for meaningful application behavior when implementing it, using tooling justified by the task. Do not claim `npm test` passed or add tests that only repeat the implementation.
- For auth integration, verify the affected login/refresh/logout/activation flow, cookies, `204` handling, failure states, and role restrictions. Source inspection and mocked checks alone do not establish a working live integration.
- For documentation-only changes, verify local links, command accuracy, and the final diff with `git diff --check`. A Markdown edit alone does not require an application build.
- Read check output and exit status before reporting success. Describe failed or blocked checks and the boundary actually verified.

## 9. Agent Workflow & Guardrails

### Before changes

- Read this file, inspect `git status`, and read the affected code and task-relevant sources.
- Identify the requested outcome, existing patterns, and necessary business/API decisions. Ask a specific question only when a missing decision blocks dependent work; continue independent authorized work.
- Use relevant project skills. Preserve decisions and authorization already supplied in the conversation.

### During changes

- Keep edits within task scope and preserve unrelated working-tree and staged changes. Avoid destructive cleanup, resets, and overwrites.
- Treat backend sources as integration references for frontend work. Backend code, migrations, and API-contract changes need to be included in the authorized task scope.
- Keep credentials, tokens, and secrets out of commits and diagnostic output. Leave dependencies and generated build/type files ignored by Git.
- Record agreed business decisions in the requirements guide and integration decisions in the auth baseline. Update README when setup, commands, or structure change; keep shared guidance here so CLAUDE.md remains consistent.
- Live email, financial, publishing, and shared-repository actions require task authorization. Reference documents alone do not provide it.

### After changes

- Run the checks appropriate to the change, inspect the complete diff, and confirm scope and documentation consistency.
- Report what changed, why, checks run, and remaining limitations. Make completion claims from observed evidence.
- Commit, push, or publish when requested or covered by the task's authorization. Follow the filesystem/tool permission boundary when an operation requires escalation.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
