# WorkFlow Manager

A small but realistic **employee / project management portal**, built to be a target for learning **Playwright end-to-end testing** from beginner to production level.

It is a real full-stack app, not a static demo:

- real authentication (bcrypt password hashes, JWT in an **httpOnly cookie**, server-side session checks)
- a real database (SQLite through Prisma) with predictable seed data
- a REST API with proper status codes (200, 201, 400, 401, 403, 404, 409, 500)
- loading, empty, error, toast, modal, disabled and validation states built in on purpose
- semantic, accessible markup, so `getByRole` / `getByLabel` work everywhere

> No Playwright code is included yet. Writing the tests is the next phase.

---

## Table of contents

1. [Architecture](#1-architecture)
2. [Tech stack](#2-tech-stack)
3. [Installation](#3-installation)
4. [Environment setup](#4-environment-setup)
5. [Database setup & seeding](#5-database-setup--seeding)
6. [Running the app](#6-running-the-app)
7. [Test credentials & seed data](#7-test-credentials--seed-data)
8. [API documentation](#8-api-documentation)
9. [Frontend routes](#9-frontend-routes)
10. [Project structure](#10-project-structure)
11. [Testability notes (selectors, timings, quirks)](#11-testability-notes)
12. [Suggested Playwright learning journey](#12-suggested-playwright-learning-journey)

---

## 1. Architecture

```
┌──────────────────────────┐        ┌───────────────────────────┐       ┌──────────────┐
│  Browser (React SPA)     │ /api/* │  Express API (Node + TS)  │Prisma │   SQLite     │
│  Vite dev server :5173   ├───────►│  :4000                    ├──────►│  dev.db      │
│  (proxies /api, /uploads)│◄───────┤  JWT cookie auth          │       └──────────────┘
└──────────────────────────┘ cookie │  /uploads (avatar files)  │
                                    └───────────────────────────┘
```

- **Single origin in development.** Vite proxies `/api` and `/uploads` to the backend, so the browser only talks to `localhost:5173` and cookies just work.
- **Auth.** `POST /api/auth/login` sets an httpOnly `wf_token` cookie holding a signed JWT. JavaScript cannot read the cookie. The SPA asks `GET /api/auth/me` who is logged in. "Remember me" makes the cookie persistent for 30 days; otherwise it is a session cookie and the JWT expires after 1 day.
- **Authorization.** Users are `ADMIN` (full access) or `VIEWER` (read-only). Viewers get **403** from create, update and delete endpoints, and see an "Access denied" page on create/edit routes.
- **Consistent JSON.** Success responses are `{ "data": ..., "meta"?: ... }`. Errors are `{ "error": { "code", "message", "details"? } }`, where `details` maps field names to messages.
- **Production mode.** `NODE_ENV=production` makes the backend also serve `frontend/dist`, with an SPA fallback.

## 2. Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19, TypeScript, Vite, React Router 7, React Hook Form, hand-written CSS |
| Backend  | Node.js, Express 5, TypeScript (run with `tsx`), Zod validation, Multer uploads |
| Database | SQLite + Prisma ORM 6 (migrations + seed script) |
| Auth     | bcryptjs password hashing, jsonwebtoken, httpOnly cookies |

## 3. Installation

Requirements: **Node.js 20+** (developed on Node 24) and npm.

```bash
# from the project root: installs everything, creates .env files, migrates and seeds the DB
npm run setup
```

Or step by step:

```bash
npm install                      # root (concurrently)
npm --prefix backend install
npm --prefix frontend install
```

## 4. Environment setup

`npm run setup` creates both `.env` files for you (`npm run env:init` does only that step). To do it by hand:

```bash
cp backend/.env.example backend/.env     # then set JWT_SECRET to a long random string
cp frontend/.env.example frontend/.env
```

**backend/.env**

| Variable        | Example                    | Purpose |
|-----------------|----------------------------|---------|
| `DATABASE_URL`  | `file:./dev.db`            | SQLite file, relative to `backend/prisma/` |
| `JWT_SECRET`    | long random string         | Signs session tokens |
| `PORT`          | `4000`                     | API port |
| `CLIENT_ORIGIN` | `http://localhost:5173`    | CORS origin (only matters without the Vite proxy) |
| `NODE_ENV`      | `development`              | `production` sets `Secure` cookies and serves `frontend/dist` |

**frontend/.env**

| Variable                | Example                 | Purpose |
|-------------------------|-------------------------|---------|
| `VITE_API_PROXY_TARGET` | `http://localhost:4000` | Where Vite proxies `/api` and `/uploads` |
| `VITE_PORT`             | `5173`                  | Dev server port |

`.env` files are git-ignored. Only the `.env.example` files are meant to be committed.

## 5. Database setup & seeding

```bash
cd backend
npm run db:migrate   # create/upgrade the schema (prisma migrate dev)
npm run db:seed      # wipe all data and insert the predictable seed data
npm run db:reset     # drop DB, re-run all migrations, then seed
npm run db:studio    # browse the data in Prisma Studio
```

Seeding is **idempotent and deterministic**. It deletes everything and resets the auto-increment counters, so after every seed John Doe is `/employees/1`, Engineering is department `1`, and so on. Re-seed before a test run to get a known state.

Schema (see [backend/prisma/schema.prisma](backend/prisma/schema.prisma)):

- **User**: login accounts (`firstName`, `lastName`, unique `email`, `passwordHash`, `phone?`, `role`)
- **Department**: unique `name`
- **Role**: job role, belongs to a Department
- **Employee**: personal, professional, address and emergency-contact fields, `skills` (JSON array), `status`, optional `manager` (self-relation), `avatarUrl`

## 6. Running the app

```bash
# from the project root: API + web together
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000/api (health check: `/api/health`)

Or in two terminals:

```bash
npm run dev:backend    # tsx watch, restarts on change
npm run dev:frontend   # Vite with HMR
```

Production-like run:

```bash
npm run build
cd backend && NODE_ENV=production npm start   # serves API + built SPA on :4000
```

Refreshing the browser on any route (e.g. `/employees/3/edit`) works in both modes.

## 7. Test credentials & seed data

| Role   | Email                     | Password     | Can do |
|--------|---------------------------|--------------|--------|
| Admin  | `test.user@example.com`   | `Test@12345` | Everything |
| Viewer | `viewer.user@example.com` | `Test@12345` | Read-only (403 on create/edit/delete) |

You can also sign up new accounts through `/signup`. New accounts are admins.

**Seeded data:** 6 departments, 19 roles, **25 employees** (`EMP-1001` … `EMP-1025`, ids 1–25), **21 active / 4 inactive**. That makes 3 pages at 10 rows per page.

| Department      | Employees | Notable rows |
|-----------------|-----------|--------------|
| Engineering     | 8 | EMP-1001 John Doe (manager), EMP-1009 David Miller (**inactive**) |
| Design          | 4 | EMP-1002 Priya Sharma (lead), EMP-1011 James Taylor (**inactive**) |
| Sales           | 4 | EMP-1003 Michael Brown, EMP-1016 Neha Gupta (**inactive**) |
| Marketing       | 3 | EMP-1012 Olivia Martin |
| Human Resources | 3 | EMP-1004 Emma Wilson |
| Finance         | 3 | EMP-1005 Rahul Verma, EMP-1021 Mia Schmidt (**inactive**) |

Employee emails follow `first.last@workflow.test` (e.g. `john.doe@workflow.test`). The next suggested Employee ID after seeding is `EMP-1026`.

Reference data for dropdowns:

- **Countries → States → Cities:** India, United States, United Kingdom, Germany ([backend/src/data/locations.ts](backend/src/data/locations.ts))
- **Skills:** 16 fixed values ([backend/src/data/skills.ts](backend/src/data/skills.ts))

## 8. API documentation

All endpoints are under `/api`. Everything except the four public auth endpoints and `/health` needs the `wf_token` cookie, and returns **401** without it.

### Auth

| Method | Path | Body | Success | Errors |
|--------|------|------|---------|--------|
| POST | `/auth/signup` | `{ firstName, lastName, email, password, confirmPassword, acceptTerms }` | **201** `{ data: User }` + cookie | 400 validation, 409 email exists |
| POST | `/auth/login` | `{ email, password, rememberMe? }` | **200** `{ data: User }` + cookie | 400 validation, 401 invalid credentials |
| POST | `/auth/logout` | – | **200**, clears cookie | – |
| POST | `/auth/forgot-password` | `{ email }` | **200** generic message (no email is sent) | 400 |
| GET  | `/auth/me` | – | **200** `{ data: User }` | 401 |

### Employees

| Method | Path | Notes | Success | Errors |
|--------|------|-------|---------|--------|
| GET | `/employees` | Query: `page` (1), `pageSize` (10, max 100), `search`, `department` (id), `role` (id), `status` (`ACTIVE`/`INACTIVE`), `sortBy` (`employeeCode`, `name`, `email`, `department`, `role`, `status`, `joiningDate`, `createdAt`), `sortOrder` (`asc`/`desc`) | **200** `{ data: Employee[], meta: { page, pageSize, total, totalPages } }` | 400 bad query |
| GET | `/employees/:id` | | **200** `{ data: Employee }` | 404 |
| POST | `/employees` | Admin only. Body: see below | **201** `{ data: Employee }` | 400, 403, 409 duplicate email / Employee ID |
| PUT | `/employees/:id` | Admin only. Full body | **200** `{ data: Employee }` | 400, 403, 404, 409 |
| DELETE | `/employees/:id` | Admin only | **200** `{ data: { message } }` | 403, 404 |
| GET | `/employees/managers` | Active employees for the manager dropdown | **200** | |
| GET | `/employees/next-code` | Admin only. Suggests the next free `EMP-xxxx` | **200** `{ data: { employeeCode } }` | 403 |

`search` matches first name, last name, email or Employee ID (case-insensitive). Multiple words must all match, so `john doe` finds John Doe.

Employee create/update body:

```json
{
  "firstName": "Jane", "lastName": "Roe", "email": "jane.roe@workflow.test",
  "phone": "+919999988888", "dateOfBirth": "1994-02-10", "gender": "FEMALE",
  "avatarUrl": "/uploads/<file>.png",
  "employeeCode": "EMP-1026", "departmentId": 1, "roleId": 3,
  "employmentType": "FULL_TIME", "joiningDate": "2026-01-05", "salary": 1500000,
  "status": "ACTIVE", "managerId": 1,
  "address": "12 Park Street", "country": "India", "state": "Rajasthan", "city": "Jaipur",
  "pincode": "302001", "skills": ["React", "SQL"],
  "emergencyContactName": "John Roe", "emergencyContactPhone": "+919999977777"
}
```

Server-side rules include: age ≥ 18, joining date after DOB and ≤ 6 months ahead, role must belong to the department, a valid country/state/city combination, 1–10 known skills, emergency phone ≠ employee phone, and an Employee ID formatted `EMP-` plus 4–6 digits.

### Uploads

| Method | Path | Body | Success | Errors |
|--------|------|------|---------|--------|
| POST | `/uploads/avatar` | `multipart/form-data`, field **`avatar`**. JPG/PNG/WEBP/GIF, ≤ 2 MB. Admin only | **201** `{ data: { url, originalName, size, mimeType } }` | 400 wrong type / too large / missing, 403 |

Uploaded files are served from `/uploads/<file>`.

### Reference data, dashboard, profile

| Method | Path | Notes |
|--------|------|-------|
| GET | `/departments` | `{ data: [{ id, name }] }` |
| GET | `/roles?departmentId=1` | All roles, or only one department's |
| GET | `/locations` | `{ data: { Country: { State: [City] } } }` |
| GET | `/skills` | `{ data: string[] }` |
| GET | `/dashboard/stats` | totals, active/inactive counts, per-department counts, 5 most recent employees |
| PUT | `/profile` | `{ firstName, lastName, phone? }` → updated User, 400 on validation |
| GET | `/health` | Public liveness check |

### Error examples

```json
// 400
{ "error": { "code": "VALIDATION_ERROR", "message": "Validation failed",
             "details": { "email": "Enter a valid email address", "skills": "Select at least one skill" } } }
// 401
{ "error": { "code": "UNAUTHORIZED", "message": "Invalid email or password" } }
// 403
{ "error": { "code": "FORBIDDEN", "message": "You do not have permission to perform this action" } }
// 404
{ "error": { "code": "NOT_FOUND", "message": "Employee not found" } }
// 409
{ "error": { "code": "CONFLICT", "message": "An employee with this email already exists",
             "details": { "email": "An employee with this email already exists" } } }
// 500
{ "error": { "code": "INTERNAL_ERROR", "message": "Something went wrong. Please try again later." } }
```

## 9. Frontend routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | public only* | Email, password, remember me, forgot-password link. Supports `?redirect=/path` |
| `/signup` | public only* | Registration with validation and terms checkbox |
| `/forgot-password` | public | Simulated reset request |
| `/dashboard` | logged in | Welcome message, stat cards, recent employees, department breakdown |
| `/employees` | logged in | Table with search, filters, sort, pagination. State lives in the URL query string |
| `/employees/create` | admin | 4-step wizard |
| `/employees/:id` | logged in | Details page with Edit/Delete |
| `/employees/:id/edit` | admin | The same wizard, pre-filled |
| `/profile` | logged in | Account info + edit name/phone |
| anything else | logged in | 404 page |

\* Logged-in users visiting `/login` or `/signup` are redirected to `/dashboard` (or to `?redirect`). Logged-out users visiting a protected route go to `/login?redirect=<original path>`, and return there after logging in.

## 10. Project structure

```
.
├── package.json              # root scripts: setup, dev (runs both), build
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # data model
│   │   ├── migrations/       # SQL migrations
│   │   └── seed.ts           # deterministic seed data
│   ├── uploads/              # uploaded avatars (git-ignored)
│   └── src/
│       ├── index.ts          # starts the server
│       ├── app.ts            # express app: middleware, routes, static files, errors
│       ├── config/env.ts     # typed environment variables
│       ├── lib/prisma.ts     # Prisma client
│       ├── routes/index.ts   # all /api routes + which need auth/admin
│       ├── controllers/      # request/response handling per area
│       ├── services/         # employee business logic & queries
│       ├── validators/       # zod schemas (request validation)
│       ├── middleware/       # auth, error handler, upload (multer)
│       ├── data/             # static reference data (locations, skills, departments)
│       └── utils/            # HttpError helpers, JWT, DTO mappers
└── frontend/
    ├── vite.config.ts        # dev proxy to the API
    └── src/
        ├── main.tsx, App.tsx # providers + route table
        ├── routes/guards.tsx # ProtectedRoute, PublicOnlyRoute, AdminRoute
        ├── layouts/          # AuthLayout, AppLayout (sidebar + header)
        ├── context/          # AuthContext (session), ToastContext (notifications)
        ├── pages/            # one component per route
        │   └── employee-form/  # the multi-step wizard (steps, stepper, validation model)
        ├── components/       # ConfirmDialog, Pagination, Spinner, FormField, Avatar, ...
        ├── services/         # fetch wrapper (ApiError) + API modules
        ├── hooks/            # useDebounce, useDocumentTitle
        ├── types/            # shared TypeScript types
        └── utils/            # formatting + validation rules
```

## 11. Testability notes

These details are useful once you start writing tests.

**Selectors: prefer roles and labels.** Every form control has a `<label>`, so `getByLabel('First name')` works. Some useful accessible names:

| Element | Suggested locator |
|---------|-------------------|
| Login button | `getByRole('button', { name: 'Log in' })` |
| Sidebar links | `getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Employees' })`. The active link has `aria-current="page"` |
| Logout | `getByRole('button', { name: 'Logout' })` |
| Employees table | `getByRole('table', { name: 'Employees' })` |
| Row actions | `getByRole('link', { name: 'View John Doe' })`, `getByRole('link', { name: 'Edit John Doe' })`, `getByRole('button', { name: 'Delete John Doe' })` |
| Sortable headers | `getByRole('button', { name: 'Name' })`. The `<th>` carries `aria-sort` |
| Pagination | `getByRole('navigation', { name: 'Pagination' })`, `getByRole('button', { name: 'Page 2' })`. The current page has `aria-current="page"` |
| Filters | `getByLabel('Search')`, `getByLabel('Department')`, `getByLabel('Role')`, `getByLabel('Status')`, `getByRole('button', { name: 'Reset Filters' })` |
| Wizard | Heading `Step 2 of 4: Professional Information`. Stepper buttons `Step 3: Address & Additional Information`. Buttons `Next`, `Back`, `Cancel`, `Edit Step 1..3`, `Submit Employee` / `Update Employee` |
| Employment type | `getByRole('radio', { name: 'Contract' })` |
| Skills | `getByRole('checkbox', { name: 'React' })` |
| File upload | `getByLabel('Profile picture')` → `setInputFiles(...)`. Preview `getByRole('img', { name: 'Profile picture preview' })`. Button `Remove image` |
| Delete modal | `getByRole('dialog')` with text "Are you sure you want to delete this employee?". Buttons `Cancel` / `Delete` |
| Toasts | Success toasts are `role="status"`, error toasts are `role="alert"`. Each has `data-testid="toast"` and a `Dismiss notification` button |
| Field errors | Rendered under the field with `role="alert"`. The input gets `aria-invalid="true"` |

`data-testid` is used only where semantics don't help: `stat-total`, `stat-active`, `stat-inactive`, `welcome-name`, `results-summary`, `current-user`, `profile-name`, `toast`, `skills-count`, `avatar-file-name`.

> Tip: `getByLabel('Phone')` is a substring match. On Step 3 it does not matter (Step 1 isn't rendered), but on other pages use `{ exact: true }` when one label is contained in another.

**Timings & behaviour worth knowing**

- Search is **debounced by 400 ms**, then written to the URL (`?search=...`) and fetched from the server. Assert on the result, not on a fixed wait.
- Any filter or search change resets to page 1. All list state (`search`, `department`, `role`, `status`, `sortBy`, `sortOrder`, `page`, `pageSize`) is in the URL, so deep links and reloads work.
- Toasts auto-dismiss after **5 seconds**.
- Only the current wizard step is rendered, but values are kept when moving between steps. In edit mode all steps are reachable from the stepper immediately.
- The wizard's **Cancel** button opens a native `window.confirm()` when there are unsaved changes (good for `page.on('dialog')`).
- Profile **Save Changes** stays disabled until something changes. Submit buttons are disabled with a "...ing" label while requests are in flight.
- When logged out, the browser console shows a `401` network log for `/api/auth/me` on page load. That is expected (it's how the app learns you're logged out). The same goes for intentional 4xx responses such as 409 duplicates.
- An expired or deleted session makes any API call return 401. The UI then drops to `/login` with the message "Your session has expired. Please log in again." (Try deleting the `wf_token` cookie mid-test.)

## 12. Suggested Playwright learning journey

The app was designed so each stage below has real features to practise on. (Tests are intentionally not included yet.)

### Beginner
- **First test & navigation:** open `/login`, assert the title (`Login | WorkFlow Manager`) and heading.
- **Locators:** `getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`. Practise on the login/signup forms.
- **Assertions:** `toHaveURL`, `toBeVisible`, `toHaveText`, `toBeDisabled`, `toHaveValue`, `toBeChecked`.
- **Form basics:** fill login, check "Remember me", submit, land on `/dashboard`.
- **Validation:** submit empty forms, check each error message, password mismatch, terms checkbox.
- **Negative paths:** wrong password → "Invalid email or password". Duplicate signup email.

### Intermediate
- **Protected routes:** visit `/employees` logged out, expect `/login?redirect=%2Femployees`, log in, expect to return.
- **Logout:** session is gone and protected pages redirect again.
- **Tables:** count rows, read cells, locate a row by text and click its `Edit`/`Delete`.
- **Search, filters, sort, pagination:** combine them and assert URL query params plus the "Showing x–y of z" summary.
- **Empty & loading states:** search for nonsense → "No employees found".
- **Multi-step wizard:** complete all 4 steps. Test per-step validation, Back/Next keeping data, cascading Country → State → City and Department → Role dropdowns, the review page, "Edit Step N" links.
- **File upload:** `setInputFiles` with a valid image (preview appears), a `.txt` (type error), a > 2 MB file (size error), then "Remove image".
- **Edit flow:** open `/employees/1/edit`, verify pre-filled values, change fields, submit, verify "Employee updated successfully" and the details page.
- **Delete flow:** modal Cancel vs Delete, toast, row disappears.
- **Toasts & dialogs:** assert toast text. Handle the native `confirm()` on wizard Cancel.

### Advanced
- **Authentication state reuse:** log in once in a setup project, save `storageState`, reuse it across tests. Separate states for admin and viewer.
- **Role-based testing:** as the viewer, assert no Edit/Delete buttons and "Access denied" on `/employees/create`.
- **API testing (`request` fixture):** call `/api/auth/login` and then `/api/employees` directly. Assert status codes and JSON shape (400/401/403/404/409).
- **Hybrid tests:** create data through the API, then verify it in the UI (and clean it up via API).
- **Network mocking with `page.route()`:**
  - make `GET /api/employees*` return 500 → "Unable to load employees. Please try again." + Try again
  - delay a response → assert "Loading employees..."
  - fail `POST /api/employees` or `DELETE /api/employees/:id` → error toast ("Failed to create employee..." / "Failed to delete employee...")
  - abort a request → network-error handling
  - return a 401 from any endpoint → session-expired redirect
  - return an empty list → empty state
- **`waitForResponse` / `waitForRequest`:** assert that a filter sends the right query parameters.
- **Page Object Model:** `LoginPage`, `EmployeesPage`, `EmployeeWizard` (with `fillStep1()`...), `ConfirmDialog`.
- **Fixtures:** custom fixtures for a logged-in page, seeded data, or a freshly created employee.
- **Test data management:** reset the DB with `npm run db:seed` in `globalSetup`. Use unique emails per test (`Date.now()`) so tests run in parallel safely.

### Production-style
- **`webServer` config** to boot backend + frontend automatically before tests.
- **Projects** for Chromium, Firefox, WebKit and a mobile viewport (the layout is responsive).
- **Parallelism & isolation**, retries, `test.describe.configure({ mode: 'serial' })` where order matters.
- **Tracing, screenshots, videos** on failure, and the HTML report.
- **Visual comparisons** (`toHaveScreenshot`) for dashboard cards or the wizard stepper.
- **Accessibility checks** (e.g. axe) against these semantic pages.
- **CI pipeline** (GitHub Actions): install, migrate, seed, run tests, upload the report.
- **Tagging & filtering** (`@smoke`, `@regression`), sharding.
