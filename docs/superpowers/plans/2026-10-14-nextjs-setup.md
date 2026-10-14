# Next.js Setup Implementation Plan

> **For agentic workers:** Implement this setup inline and use superpowers:verification-before-completion before reporting success.

**Goal:** Set up a runnable Next.js frontend and useful project and agent documentation.

**Architecture:** Generate an official minimal App Router starter, place application code under `src/app`, and keep configuration at the repository root. `AGENTS.md` holds shared guidance; `CLAUDE.md` references it.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, ESLint, npm.

**Spec:** `docs/superpowers/specs/2026-10-14-nextjs-setup-design.md`

## Global Constraints

- Use npm and preserve the existing Git history.
- Keep application code under `src/app` with `@/*` mapped to `src/*`.
- Use system fonts so a production build does not need to download fonts.
- Add no product features or backend integration.

## Review Focus

- A fresh install uses the checked-in npm lockfile.
- Documented commands exist and run successfully.
- The home page renders with the project title.
- Generated output, dependencies, and secrets are ignored by Git.
- Shared and Claude-specific guidance remain consistent.

## Task 1: Starter and documentation

**Files:** `package.json`, `package-lock.json`, `src/app/*`, `.gitignore`, `.nvmrc`, `next.config.ts`, `next-env.d.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `README.md`, `AGENTS.md`, `CLAUDE.md`.

**Interfaces:** `npm run dev` serves the app; `npm run build` produces production output; `npm start` serves that output; `npm run lint` and `npm run typecheck` validate source.

- [x] Generate a minimal TypeScript, App Router, Tailwind, ESLint starter with npm and a `src` directory.
- [x] Set project metadata and add a `typecheck` script.
- [x] Write the README and agent guidance based on the actual generated files.
- [x] Install dependencies and retain `package-lock.json`.
- [x] Run `npm run lint`, `npm run typecheck`, and `npm run build -- --webpack`; expect exit code 0 for each.
- [x] Start the production server and request `/`; expect HTTP 200 and the ERBM frontend title.
- [x] Review the diff and Git ignore rules; leave changes ready for the user to review.

This task changes scaffolding, configuration, and documentation. Use direct build and runtime checks instead of adding tests that mirror the starter.

## Execution notes

- The generated Next.js 16.4 starter used a Tailwind Turbopack loader. Switch to the official PostCSS integration so both Turbopack and Webpack are supported.
- This environment blocked Turbopack's local worker port, including the requested escalation. Verify the supported Webpack production build and document the alternate commands while preserving the framework's default bundler.
- The initial audit reported five development-only findings from an unpatched `braces` advisory in the ESLint dependency chain. The production dependency audit found zero vulnerabilities. Keep the matching Next.js ESLint configuration instead of applying npm's proposed major-version downgrade.
- Independent read-only review found no issues. Runtime verification returned HTTP 200; the rendered document contains the expected title and heading, and the production CSS includes the Tailwind utilities used by the home page. The temporary production server was stopped after verification.
