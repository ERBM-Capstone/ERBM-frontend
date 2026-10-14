# Frontend authentication integration baseline

## Sources and scope

The project owner supplied the backend authentication skill on October 14, 2026. Its [reference snapshot](references/backend-authentication-skill.md) is retained as documentation. The snapshot describes backend workflows and Go-specific checks; it is not installed as a frontend skill.

The API details below were checked against the sibling backend working tree on that date. They describe the current implementation, not a deployed-service or end-to-end verification. Recheck the affected backend sources when implementing an auth feature because this snapshot can become stale.

Paths in this source map are relative to the sibling backend repository (`../backend` from the frontend root):

| Concern | Backend sources |
| --- | --- |
| Registered endpoints, role gates, CORS | `internal/router/router.go` |
| Refresh cookie and HTTP responses | `internal/handler/auth.go`, `dto/response.go`, `dto/error.go` |
| Auth and activation payloads | `dto/auth.go`, `dto/activation.go` |
| Login, refresh, current profile | `internal/service/auth.go` |
| Activation and emailed link | `internal/service/activation.go`, `internal/pkg/activation/token.go` |
| Admin account onboarding | `dto/employee.go`, `internal/handler/employee.go`, `internal/service/employee.go` |
| Account states and role seeds | `internal/model/user.go`, `migrations/0001_create_auth_tables.up.sql` |
| Defaults and activation URL setting | `config/config.go` |

The frontend currently provides the Next.js scaffold. API transport, access-token persistence, auth screens, and route guards have not been implemented or selected.

## HTTP contract

All routes have the `/api/v1` prefix.

| Method | Full path | Request/authentication | Successful result |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | JSON `{ "email": "...", "password": "..." }` | `200`: access token in JSON and refresh token in an HttpOnly cookie. |
| POST | `/api/v1/auth/refresh` | Browser/backend request supplies the refresh cookie. | `200`: a new access token; no refresh-token rotation. |
| POST | `/api/v1/auth/logout` | Request must reach the origin that owns the refresh cookie. | `204`: clears the cookie; no JSON body. |
| POST | `/api/v1/auth/activation/set-password` | JSON `{ "token": "...", "password": "..." }` | `200`: account activated; `data.message` describes success. No login tokens are issued. |
| POST | `/api/v1/auth/activation/resend` | JSON `{ "email": "..." }` | `204`: the same response for missing, invited, active, and deactivated accounts when processing succeeds. |
| GET | `/api/v1/me` | `Authorization: Bearer <access_token>` | `200`: current account and employee profile. |
| GET | `/api/v1/roles` | Bearer access token and `ADMIN` role. | `200`: assignable roles. |

JSON responses use the shared envelope:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "access_token": "<access token>",
    "expires_in": 900
  }
}
```

This is an illustrative login/refresh response using the default access-token lifetime. Read token fields from `data`; `expires_in` is in seconds and may differ with backend configuration.

Errors have `success: false` and `message`, with optional `errors`; `data` may be absent. Handle HTTP status and the envelope together. A `204` response has no body and must not be parsed as JSON.

`/me` returns `data.user_id`, `employee_id`, `email`, `status`, `first_login`, `role_code`, `first_name`, `last_name`, and `position`. Use `role_code` for role-aware UI; `position` is employee profile data, not a permission grant.

## Session and account behavior

- The refresh cookie is named `refresh_token`, uses `HttpOnly` and `SameSite=Lax`, and has path `/api/v1/auth`. `Secure` is controlled by the backend's `REFRESH_COOKIE_SECURE` setting. Browser JavaScript cannot read the refresh token.
- Default access-token lifetime is 15 minutes; default refresh lifetime is 168 hours. Use the returned access-token lifetime rather than hard-coding expiration.
- Login and refresh require an account with status `ACTIVE`. Other account states are `INVITED` and `DEACTIVATED`.
- Unknown email, incorrect credentials, live lockout, missing password hash, and inactive account all produce the current login error `401` / `invalid email or password`. Do not assume an account-specific error or a lockout countdown is returned. Defaults are 10 failed attempts and a 3-minute lock; these are backend-configurable.
- The login service trims email but does not lowercase it. Provisioning and public activation resend normalize email differently. Account for this current distinction when defining frontend form normalization.
- Refresh validates the cookie and current account/role, issues an access token, and does not rotate the refresh token.
- Logout clears the refresh cookie. Existing access tokens are not revoked server-side.
- Protected-route middleware validates JWT claims without reloading account state/role for every request. `/me` reloads current data but does not reject a deactivated account solely because of its status. Do not assume immediate token revocation after deactivation or a role change.

## Activation

- Admin-created eligible employees receive an `INVITED` account. There is no public registration endpoint.
- The backend sends an email link based on `FRONTEND_ACTIVATION_URL`, adding the activation token as the `token` query parameter. The actual frontend route still needs to be defined.
- Activation uses an email-link token with a 24-hour lifetime. It is not an OTP flow.
- Set-password accepts `token` and `password`. The DTO requires password length `8..72`; bcrypt also limits input to 72 bytes, which matters for multibyte characters.
- Expired, used, invalidated, or otherwise invalid activation tokens return `400`. Successful activation changes the account to `ACTIVE`; it does not automatically log the user in.
- Public resend intentionally returns the same `204` for missing and non-invited accounts. This does not prove that an email was delivered; SMTP failures are suppressed in this public path.
- `first_login` is not currently cleared by activation or login. Its value alone does not establish an OTP or mandatory password-change step.

## Current role gates

The backend seeds `EMPLOYEE`, `ADMIN`, `PC`, `PM`, and `ACCOUNTING`.

- Role listing and all employee-management endpoints require `ADMIN`.
- Project read endpoints allow `ADMIN`, `PM`, `PC`, and `ACCOUNTING`; writes allow `ADMIN`, `PM`, and `PC`.
- Project-specific permissions also depend on the backend service. A role check alone does not grant access to every project.
- `EMPLOYEE` has no access to employee-management or project routes under the current route gates.

These implementation gates do not settle the advance-request, expense, and closing permission questions in the [business requirements guide](../requirements/README.md).

## Invitation and employee-account onboarding

For Admin invitation forms, `POST /api/v1/employees` accepts a non-empty JSON array, including when creating one employee. Each item requires `first_name`, `last_name`, `position`, `email`, `date_hired`, and `role_code`; `employment_end_date` is optional. Dates use `YYYY-MM-DD`, and an end date must not precede the hire date. Success returns `201` with employee profiles in `data`.

- Retrieve assignable role IDs/codes from the Admin-only roles endpoint. `role_code` is separate from HR position.
- An employee with any employment end date is currently considered inactive, including a future date. Inactive employees receive only a profile, without a login account or invitation. `is_active` is derived response data.
- Creation is an atomic JSON batch; it does not provide CSV/XLSX import or partial row success. Duplicate normalized emails return a conflict. Do not infer an API row limit from the repository's insert batch size.
- Invitations are sent after the transaction commits. Employee creation can succeed despite SMTP failure, so a success message should not promise email delivery.
- `POST /api/v1/employees/:id/resend-activation` is Admin-only. It returns bodyless `204` on success, `404` for a missing account, `409` when activation is unavailable, or `502` for email delivery failure. On that delivery failure the replacement token remains committed and old links are invalidated.
- Profile PATCH currently accepts only first name, last name, position, and email. It does not support changing role, hire date, or employment end date.

## Integration decisions and checks

| Topic | Decision/check needed before frontend implementation |
| --- | --- |
| Transport | Choose direct browser-to-backend requests or a same-origin proxy/BFF, and define environment-specific API origins. |
| Access token | Decide client/server ownership, persistence, session restoration, refresh coordination, and bounded retries. |
| Cookies | Verify path/origin, Secure/SameSite behavior, and cookie handling through any proxy. |
| Activation UI | Define the route matching `FRONTEND_ACTIVATION_URL`, success navigation, and invalid/expired-token and resend states. |
| Route/UI guards | Define role-aware navigation and inactive-session handling while preserving backend authorization. |
| Live verification | Check login, refresh after reload/expiry, logout, activation, `204` handling, unauthorized/forbidden responses, and cookie/CORS behavior in the browser. |

For direct cross-origin browser auth, cookie-bearing requests need `credentials: "include"`. The current backend CORS configuration includes both `http://localhost:3000` and `*` while enabling credentials. This is an integration risk to check: browsers reject credentialed responses with `Access-Control-Allow-Origin: *`. A working integration needs an explicit allowed origin or the selected same-origin topology. These browser rules are documented in [MDN's CORS guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#requests_with_credentials).

Public registration, password reset/change, OTP, account reactivation, role editing, and an initial Admin bootstrap command are absent from the supplied backend baseline. New frontend flows for those capabilities require their own agreed API contract.
