# ERBM requirements guide

## Source and interpretation

This guide summarizes [ERBM — Advance Request Flow Requirement Analysis](ERBM_Advance_Request_Requirement_Analysis.md), supplied by the project owner on October 14, 2026. A copy of the supplied analysis is kept alongside this guide for shared reference.

The source distinguishes its current flow and known rules from recommendations, example schemas, and questions for the client. This guide preserves that distinction. The source's suggested next artifacts and client questions describe possible work; they do not authorize all of that work or settle the open decisions.

The current repository implements the Next.js frontend scaffold. The business workflow below is the documented scope for future development. The current backend authentication contract is separately documented in the [authentication integration baseline](../integration/authentication.md). Advance/expense/closing API contracts and product screens have not been specified in this repository.

## Documented workflow

### Advance request and PM review

- PC creates an advance request for an assigned project with status `Draft` and enters the advance amount and business purpose.
- Submission changes `Draft` to `Pending PM Approval` and routes review to the responsible PM.
- PM may return the request with a required reason, changing its status to `Returned for Revision`.
- Viewing a returned request leaves its status unchanged. Saving revisions changes it to `Draft`; resubmission returns it to `Pending PM Approval`.
- PM approval changes the status to `Approved`.
- PC generates and prints the approved request. MD signs the paper document outside the system in phase 1.
- Submission, return, revision, and resubmission history must be retained.

### Disbursement

- The signed paper document is sent to Accounting through the existing business process.
- Accounting pays the funds through the existing financial process and then confirms that disbursement occurred.
- Confirmation is a record of actual payment, not an additional business approval.
- Before activation, check whether the same project already has another `Active` advance. If it does, prevent the new advance from becoming `Active`.
- Successful confirmation changes `Approved` to `Active` and records disbursement details and action history.

### Expense recording and OCR

- PC records expenses while the advance is `Active` and enters a business purpose.
- Each expense has one receipt/supporting document. Retain the original PDF/image and its metadata.
- OCR extracts receipt header fields and line items. Extracted fields may be empty when unavailable or uncertain.
- PC reviews and corrects extracted data and explicitly confirms the expense amount used to deduct the advance budget.
- OCR grand totals are not automatically trusted. Receipt line items are evidence for review/audit, not separate expense transactions or budget deductions.

### Closing and reconciliation

- PC prepares reconciliation and submits a closing request, changing the advance status to `Closing`.
- The documented equation is `Advance Amount = Total Confirmed Expenses + Return Amount`.
- Accounting reviews reconciliation, confirmed expenses, documents, and action history.
- Accounting may return closing for correction with a required reason; PC corrects the relevant information and resubmits. The status used for this returned closing is not defined.
- Accounting confirms final closing when reconciliation and evidence are correct, changing the status to `Closed`.
- An `Active` advance must be closed before crossing the fiscal-year boundary. The fiscal calendar and enforcement behavior remain undefined.
- A project may have multiple advances over its lifetime, with a new advance allowed when no advance is `Active`. Whether other unfinished statuses should also block an advance is an open question.

## Documented roles and project fields

| Role | Responsibility in the current flow |
| --- | --- |
| PC | Create, revise, and resubmit requests; record expenses; initiate and correct closing. |
| PM | Review, approve, and return advance requests. |
| Accounting | Confirm actual disbursement; review, return, and confirm closing. |
| MD | Sign the paper document outside the system in phase 1. |

An Admin role is recommended in the original analysis. The separately inspected backend authentication implementation already seeds `ADMIN` and uses it for role listing and employee management. This establishes the current auth integration baseline; Admin permissions within the advance workflow, record visibility, edit/delete permissions, assignment transfer, and department-level access still need decisions.

The source's minimal required project fields are Project Code, Project Name, Responsible PM, Project Coordinator, and Status (`Active` / `Inactive`, default `Active`). Code-generation format and user-assignment cardinality remain open. Fiscal Year/Period, dates, department, project budget, client, and notes are recommended or optional fields.

## Status baseline

The current flow names `Draft`, `Pending PM Approval`, `Returned for Revision`, `Approved`, `Active`, `Closing`, and `Closed`.

The source also proposes an implementation enum, including `PENDING_CLOSING_REVIEW`, `CLOSING_RETURNED`, `CANCELLED`, and `REJECTED`. Those additions and mappings have not been decided. A proposed enum must not silently replace the status baseline.

## Open decisions

| Area | Decision needed | Source section |
| --- | --- | --- |
| Permissions and assignments | Visibility per role, Admin scope, editing/deleting, owner transfer, and whether projects can have multiple PCs/PMs. | 5.1, 6 |
| Status transitions | Closing-return status, cancellation/rejection, any waiting-for-disbursement status, and failed-confirmation behavior. | 5.2 |
| Concurrent advances | Whether Approved, Closing, or returned-closing advances also prevent another advance; the documented restriction explicitly covers Active. | 5.6 |
| Amounts and validation | Currency, decimal precision, amount limits, purpose length, dates, project eligibility, and tax requirements. | 5.3, 5.7 |
| Documents | Template, output format, numbering, regeneration/versioning, and signed-document upload. | 5.4, 5.15 |
| Disbursement | Required payment fields, supporting evidence, and whether the paid amount must equal the approved amount. | 5.5 |
| Expense correction | Edit/delete windows, receipt reuse, categories/vendor fields, and expense statuses. | 5.7 |
| Overspending and returns | Whether expenses can exceed the advance, how a negative calculated return is handled, and whether proof of repayment is required. | 5.7, 5.9 |
| OCR and uploads | Provider, asynchronous processing, failure/manual-entry behavior, languages, file types/limits, confidence, raw result retention, and storage/access. | 5.8, 5.13 |
| Fiscal year | Start/end dates, deadlines, affected statuses, blocked actions, notifications, and overrides. | 5.10 |
| Audit and worklists | Action vs field-level history, visibility/export, notification channels, filters, and read/unread behavior. | 5.11, 5.12, 5.14 |
| Accounting integration | Export, ERP integration, voucher/GL/cost-center fields, and the agreed phase-1 boundary. | 5.16 |
| Frontend integration | Advance/expense/closing API contracts, UI/wireframe references, and the transport/session/UI decisions listed in the separate auth integration baseline. | Not specified by the supplied analysis; auth API checked against backend source separately |

The source's suggested stricter concurrent-advance rule, non-negative return rule, matching disbursement amount, 30-day year-end reminder, and post-year-end expense block are recommendations. Keep them open until the project owner or client decides them.

## Recording decisions

When an open question is answered, record the agreed rule, its affected flow/status/role, and the date here. Update the summary in `AGENTS.md` if a core business rule changes. Keep the original analysis as the supplied reference, and keep shared agent guidance in the root `AGENTS.md` so `CLAUDE.md` continues to use the same instructions.

No open decisions have been resolved by importing this document.
