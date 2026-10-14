# Next.js setup

## Goal

Initialize the ERBM frontend with Next.js and provide a useful README and instructions for coding agents.

## Scope and assumptions

- The repository currently contains only a placeholder README.
- Use npm, TypeScript, the App Router, Tailwind CSS, and ESLint.
- Keep application code under `src/app` with `@/*` mapped to `src/*`.
- Use the stable packages selected by the official `create-next-app` generator and commit the npm lockfile with future source commits.
- Provide a minimal home page and project metadata without introducing product features or backend integration.
- Use system fonts so a production build does not need to download fonts.
- Use `AGENTS.md` for shared project guidance and `CLAUDE.md` to reference it.

## Deliverables

The app includes development and production scripts, a separate type-check command, framework configuration, a root layout, and a home page. The README explains installation, commands, structure, environment variables, and verification. Agent guidance documents actual commands, server/client boundaries, styling conventions, and dependency management.

## Verification

Run ESLint, TypeScript checking, and a production build. Start the production server and verify that `/` returns HTTP 200 with the project title. Check the final diff for generated build artifacts or accidental changes to repository history.
