# OpenAPI and Swagger UI

The backend serves its API documentation locally:

- Swagger UI: **http://localhost:5000/api-docs/**
- OpenAPI JSON: **http://localhost:5000/openapi.json**
- Submission/import file: **backend/docs/openapi.json**

Use your configured backend port if it differs from 5000. Swagger requests use `/api` on the current host and port. The UI assets are served by the backend; no CDN or online Swagger validator is required.

## Start and use

Use Node.js 22.19 or later for the documentation validator and its automated checks.

1. In the backend folder, run `npm install` when installing the project or after pulling the dependency changes.
2. Configure the backend environment and database as usual, then run `npm run dev`.
3. Open `/api-docs/`. Expand a tag and operation to see roles, fields, examples and response schemas. Search using the filter box.
4. For protected operations, complete login below and click **Authorize**. Paste the access token only, without a `Bearer ` prefix.
5. Choose **Try it out**, enter the required inputs, then **Execute**. Swagger calls the actual backend. Use a test database/account when demonstrating mutations or sending login/recovery emails.

The documentation is public API metadata. Employee records, payroll data, images and mutations retain their existing authentication and permission checks. Tokens are not persisted by Swagger across page reloads, and no real passwords, database credentials or tokens are embedded in the specification.

## Two-step login

`POST /api/auth/login` accepts:

```json
{
  "username": "employee@example.test",
  "password": "your-account-password"
}
```

This sends an email OTP to the linked employee email. The response contains `require2FA: true`, not a token. Use your actual configured account; example.test addresses are documentation placeholders.

`POST /api/auth/verify-otp` accepts:

```json
{
  "username": "employee@example.test",
  "otp": "123456"
}
```

Use the latest code from your email, not the placeholder above. The OTP expires after 10 minutes. On success, copy the returned `token` into Swagger Authorize. Access tokens expire after 24 hours and can be revoked by password, role, activation or logout changes. Login and OTP guesses are rate limited.

Registration is Admin-controlled. `POST /employees` is the normal way to create an employee and linked login together. `POST /auth/register` creates an account only; an account needs a linked employee email before login can deliver an OTP. A first administrator must already exist or be explicitly bootstrapped during initial setup.

## Roles

| Role | Access |
|---|---|
| ADMIN | Employee management, attendance, payroll, tax, all reports, settings and activity history |
| HR | Employee details and EMPLOYEE account creation, unlocked attendance, shift settings, and attendance/OT-hours reports; salary values and rates are omitted |
| EMPLOYEE | Own account, profile picture, password and current approved payslips |

HR cannot assign roles, edit Admin records, delete employees, or run payroll/tax/settings mutations. Each operation states its allowed roles and additional workflow restrictions. `x-roles` in the OpenAPI file makes the same information machine-readable; it describes permissions and does not replace server authorization.

## Identifiers, dates and numbers

- An employee's numeric database `id` (for example, `7`) differs from their business `employee_id` (for example, `E002`). Employee routes, payroll routes and payslip routes generally use numeric path ids. Attendance summary endpoints document their code/id requirements individually.
- Attendance dates: `YYYY-MM-DD`.
- Payroll month inputs: `YYYY-MM` or `YYYY-MM-01`. Tax summary filtering uses the full first-of-month date.
- Durations are decimal hours: `1.5` means 1 hour 30 minutes. New calculations use minute storage; legacy HH.MM values are converted when read.
- Database DECIMAL values can be returned as strings. Financial amounts are in rupees.
- Existing endpoints have different response envelopes. Consult each success schema rather than assuming every endpoint returns `{data: ...}`.

## Payroll workflow

1. Enter/import attendance after configuring the salary structure and shift settings.
2. `POST /payrolls/generate` with `month_year` calculates drafts and skips locked records.
3. If needed, edit the draft through `PUT /payslips/employee/{employeeId}/month/{monthYear}`.
4. `POST /tax-settings/calculate` for the month, including zero-tax results.
5. `PUT /payrolls/employee/{employeeId}/month/{monthYear}` with `{"status":"Complete"}` approves it.
6. `POST /payslips/generate` generates matching approved snapshots.
7. Update the payroll status to `Paid`.

Complete payroll must be reopened before changing attendance or financial values. Regenerate a matching approved payslip after a correction. Paid payroll cannot be reopened or modified. A `409` response commonly indicates a duplicate or a workflow lock; inspect its message.

## Reports and downloads

Daily attendance data:

```text
GET /api/reports?type=daily-attendance&date=2026-11-14
GET /api/reports?type=daily-attendance&date=2026-11-14&employee=E002&department=FIN
```

Monthly attendance data:

```text
GET /api/reports?type=attendance&year=2026&month=11
```

Monthly report types are `payroll`, `payslips`, `attendance`, `overtime`, and `contributions`. HR can request only `attendance`, `overtime`, and `daily-attendance`. Employee and department filters are optional. Missing daily attendance is not inferred as absence; an empty result is `rows: []`.

Reports return JSON. **PDF export is implemented by the React Reports page**, not a backend PDF endpoint. The OpenAPI JSON can be imported into Swagger Editor or Postman for review.

## Uploads and errors

- Own profile picture: `PUT /auth/profile-picture`, multipart field `picture`, JPG/PNG/WebP, maximum 2 MB.
- Company logo: `POST /company-information/logo`, multipart field `logo`, image maximum 30 MB, Admin only.
- Attendance bulk import: JSON `{records: [...]}`, 1-2000 rows. The frontend parses CSV before calling this API.
- `400`: invalid input; `401`: missing/invalid/revoked token or credentials; `403`: insufficient role/inactive login; `404`: missing record/image; `409`: duplicate/locked workflow; `429`: authentication rate limit; `500`: server, database or mail failure.

## Maintain and validate

Edit `backend/src/docs/openapi.js`, then run from the backend folder:

```text
npm run docs:generate
npm run docs:check
npm test
```

The exported JSON is committed/delivered alongside the source for submission and offline import. Tests validate OpenAPI syntax and references, require every mounted API operation to be documented exactly once, compare source and exported JSON, load the Swagger UI/assets over a temporary localhost connection, and verify protected API routes still reject anonymous calls. No database access is needed for these documentation tests.

Only mounted routes are documented. `companySettingRoutes.js` is not mounted by the current application and is intentionally excluded.

Implementation references: [OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3.html), [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express), and [Swagger UI configuration](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/).
