---
name: authentication
description: Use when implementing, debugging, or reviewing ERBM Next.js frontend login, activation links, refresh-cookie sessions, role-aware UI, or Admin invitation forms. Backend-only authentication changes are outside this skill.
---

# Frontend Authentication

Integrate the ERBM backend contract with the existing Next.js frontend. Read root `AGENTS.md`, then inspect affected routes, API clients, session state, and tests before choosing abstractions.

## Reference map

Read task-relevant sections of [the authentication baseline](../../../docs/integration/authentication.md):

| Task | Sections |
| --- | --- |
| Login, logout, refresh, response parsing | HTTP contract; Session and account behavior; Integration decisions and checks |
| Activation links, initial password, resend | Activation; HTTP contract |
| Role-aware navigation or guards | Current role gates; Session and account behavior |
| Admin invitation/account onboarding | Invitation and employee-account onboarding |

The baseline maps backend sources under sibling `../backend`. Recheck relevant handlers/DTOs when changing an integration contract. The supplied backend skill snapshot is reference material; its Go workflow belongs to the backend. Read [business requirements](../../../docs/requirements/README.md) for advance-workflow permissions that remain unresolved.

## Integration checkpoints

- Reuse established transport and token ownership. When absent, resolve direct requests versus a same-origin proxy/BFF from task constraints; record origins, cookie handling, and session restoration before wiring auth state. Preserve existing user decisions.
- Paths start with `/api/v1`. Login/refresh return `data.access_token` and `data.expires_in` in seconds. The refresh token stays in an HttpOnly cookie. Verify cookie path/origin and credentialed CORS for the chosen topology.
- Check HTTP status and the shared envelope. Treat `204` as success without a body. Public activation resend displays a neutral confirmation and skips JSON parsing; it does not prove account existence or email delivery.
- For automatic refresh, coordinate concurrent callers and bound retries. Failed refresh ends restoration; `403` is a permission failure. Keep login/activation failures outside protected-request refresh loops, and prevent stale refresh results from restoring a logged-out session.
- Activation reads the emailed `token` query parameter and submits `{ token, password }`. Handle missing/invalid/expired links and password byte limits. Success activates the account without session tokens. `first_login` alone does not imply OTP or another password step.
- Use `/me`'s `role_code` for UI decisions and preserve backend resource authorization. Account for the documented limits on deactivation, role changes, and token revocation.
- Admin onboarding uses explicit role codes and the employee-account contract. Public registration, password reset/change, OTP, and role editing require an agreed supporting API.

## Verification

Check affected behavior: token/envelope parsing, bodyless `204`, restoration, refresh failure/concurrency, logout, activation/resend, and forbidden/inactive-account handling. Use focused tests and browser checks appropriate to the implementation; protect passwords and tokens in diagnostics.

Run root `AGENTS.md` validation commands after implementation changes. Report changes, contract decisions, checks, and remaining integration limits. Skill creation or source inspection alone does not verify live authentication.
