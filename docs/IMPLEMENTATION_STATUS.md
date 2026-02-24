# Genr8 Implementation Status

**Purpose:** Map what has actually been built in the codebase to the plan documents, so it’s clear what’s done vs not as of 02-23-2026 @ 11:40pm PST

**Plans referenced:**
- **Main plan:** [.cursor/plans/genr8_fitness_app_7f31eaa2.plan.md](../.cursor/plans/genr8_fitness_app_7f31eaa2.plan.md) (Genr8 Fitness App – includes “Setup and operations” section)
- **Everfit parity:** [docs/EVERFIT_PARITY_IMPLEMENTATION_PLAN.md](EVERFIT_PARITY_IMPLEMENTATION_PLAN.md)
- **Other plans:** Various `.cursor/plans/*.plan.md` (add_setup_guide, lab_text_file_dna_ingestion, client_app_everfit_parity, etc.) – status summarized below where relevant.

---

## 1. Main plan (Genr8 Fitness App) – implementation status

### Setup and operations (from “Add setup guide” plan – now in main plan)

| Step | Plan item | Implemented? | Evidence |
|------|-----------|---------------|----------|
| 1 | Create Postgres DB (Neon or Vercel Postgres) | N/A (dev choice) | — |
| 2 | Add `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` to `.env` | ✅ | `.env*` in `.gitignore`; `lib/auth.ts` and `prisma/seed.ts` use env; app runs with these |
| 3 | Define schema (Prisma); run migrations | ✅ | `prisma/schema.prisma` (Postgres); `package.json` has `db:migrate`, `db:seed`, `db:push`; migrations exist |
| 4 | NextAuth Credentials (login, optional sign-up) using DB | ✅ | `app/api/auth/[...nextauth]/route.ts`, `app/api/auth/register/route.ts`, `lib/auth.ts` (Credentials, bcrypt, id + role in session); `/login`, `/register` pages |
| 5 | First admin via seed or sign-up + DB update | ✅ | `prisma/seed.ts` creates admin (and test client) if not exists; `db:seed` script |
| 6 | Route protection; admin-only for `/admin` | ✅ | `app/(client)/layout.tsx` (no session → `/login`; admin → `/admin`); `app/admin/layout.tsx` (no session → `/login`; role !== admin → `/dashboard`); `lib/auth.ts` has `authorized` callback for routes |
| 7 | Production: env vars, migrations, seed on production DB | N/A (deploy step) | Documented in plan |

### Phase 1: Foundation and auth

| Item | Implemented? | Evidence |
|------|---------------|----------|
| Next.js App Router, TypeScript, Tailwind, ESLint | ✅ | `package.json`, `app/`, `tailwind.config.*`, ESLint config |
| PostgreSQL + ORM (Prisma); schema User, Client profile, roles | ✅ | `prisma/schema.prisma`: User, ClientProfile, Role (admin \| client) |
| Auth: sign up, login, logout, role-based redirect | ✅ | Register API + page; NextAuth login; logout; client → dashboard, admin → /admin |
| Client app: protected layout; dashboard placeholder | ✅ | `app/(client)/layout.tsx` (session check); `app/(client)/dashboard/page.tsx` |
| Admin: protected `/admin` layout; redirect non-admins; placeholder | ✅ | `app/admin/layout.tsx`; admin dashboard and nav |

### Phase 2: Admin – clients and DNA

| Item | Implemented? | Evidence |
|------|---------------|----------|
| Client management: list, create, edit profile | ✅ | `app/admin/clients/` (list, [id], [id]/edit, [id]/settings); `app/api/admin/clients/` (GET, POST, [id]) |
| DNA interpretation fields (admin config) CRUD | ✅ | `app/admin/dna/fields/` (list, new, [id]/edit); `app/api/admin/dna-fields/` |
| DNA results: add/edit per client; upload lab file + parse; manual entry; optional raw file | ✅ | `app/admin/clients/[id]/dna/` (new, [resultId]/edit); `app/api/admin/clients/[id]/dna/`, `app/api/admin/parse-dna-file/route.ts`; `lib/parseLabFile.ts` (GSGT format); manual entry and raw file in forms |
| Storage for lab/raw files | ✅ | `app/api/admin/upload/route.ts` (Vercel Blob); `rawFileUrl` on DNAResult |

### Phase 3: Programs and assignments

| Item | Implemented? | Evidence |
|------|---------------|----------|
| Program builder: CRUD; structure (phases, weeks, exercises) | ✅ | `app/admin/programs/` (list, [id], [id]/edit, workout-builder); `WorkoutSection`, `WorkoutSet`, `Exercise` in schema; API routes for programs, sections, sets, section-templates, exercises |
| Assign program to client (start/end date); list “My programs” for client | ✅ | `app/api/admin/clients/[id]/assignments/`, `app/api/me/assignments/`; client `app/(client)/programs/` (list, [id]) |
| Client app: view assigned programs and content; “My programs”; optional “Start workout” | ✅ | `app/(client)/programs/page.tsx`, `app/(client)/programs/[id]/page.tsx`; today/workout flow in `app/(client)/today/` |

### Phase 4: Client-facing results and progress

| Item | Implemented? | Evidence |
|------|---------------|----------|
| Client app – DNA: view their DNA results (scores, summary; optional file) | ✅ | `app/(client)/results/` (list, [id]); `app/api/results/`, `app/api/results/[id]/` |
| Client app – Progress: log progress (workout, metrics, photos); list by date; calendar of completed | ✅ | `app/(client)/progress/` (page, metrics, workouts); `app/api/progress/route.ts`; ProgressEntry in schema |
| Progress over time: charts/tables | ⚠️ Partial | Progress list and types; charts/tables may be minimal |

### Phase 5: Polish and flexibility

| Item | Implemented? | Evidence |
|------|---------------|----------|
| Lab file parser when format/sample available | ✅ | `lib/parseLabFile.ts` (GSGT); parse-dna-file API; used in new DNA result form |
| Admin: view client progress (read-only) | ⚠️ Check | Client detail may link to progress; not fully audited here |
| UX: responsive, loading/error, onboarding | ⚠️ Partial | OnboardingGate component; loading/error states vary by page |
| Branding: GNR8 colors/logo from gnr8.org | ⚠️ Partial | CSS variables (e.g. `--brand`); logo/favicon may be in place |

### Data model (main plan)

| Entity | Implemented? | Notes |
|--------|---------------|-------|
| User (id, email, password hash, name, role, createdAt) | ✅ | Prisma User + Role enum |
| Client profile (userId, DOB, phone, timezone) | ✅ | ClientProfile |
| DNA interpretation field (admin-configured) | ✅ | DNAInterpretationField |
| DNA result (per client; raw file URL; field values; summary) | ✅ | DNAResult (fieldValues JSON, rawFileUrl, summary) |
| Program (name, description, content/JSON) | ✅ | Program (+ WorkoutSection, WorkoutSet for structure) |
| Program assignment (clientId, programId, startDate, endDate, status) | ✅ | ProgramAssignment |
| Progress entry (clientId, type, value/notes, date) | ✅ | ProgressEntry |

### Key files / structure (main plan)

| Path / area | Implemented? |
|-------------|---------------|
| `app/(client)/layout.tsx`, dashboard, results, programs, progress | ✅ |
| `app/admin/layout.tsx`, clients, dna (fields), programs | ✅ |
| `app/api/auth/[...nextauth]/`, login, register | ✅ |
| `lib/db.ts`, `lib/auth.ts` | ✅ |
| `prisma/` (schema, migrations, seed) | ✅ |

---

## 2. Everfit parity plan – implementation status

The [EVERFIT_PARITY_IMPLEMENTATION_PLAN.md](EVERFIT_PARITY_IMPLEMENTATION_PLAN.md) describes gaps and phased work. Summary vs current codebase:

- **Phase 1 (client manager parity):** Archive/reactivate, search, filters, groups, bulk add, CSV import, ClientSettings, consultation file, multi-client assign — **implemented in schema and/or UI:** ClientGroup, UserClientGroup; ClientSettings (workout toggles, pinnedMetrics); consultation file (consultationFileUrl, upload); archive (archivedAt on User); client list filters; bulk add and CSV import APIs; assign-many UI. Many Phase 1 items are done.
- **Phase 2 (workout/program structure):** Exercise, WorkoutSection, WorkoutSet, SectionTemplate, program builder UI with sections/sets, exercise library, tags, copy/paste — **implemented:** Exercise, WorkoutSection, WorkoutSet, SectionTemplate in schema; admin exercise library and workout builder UI; program tags (JSON); clone/copy routes for programs/sections.
- **Phase 3+ (calendar, assignments to dates, logging, etc.):** Partially present (e.g. assignments, progress, today page); full “Master Planner” / calendar assign and advanced tracking may still be gaps.

See EVERFIT_PARITY_IMPLEMENTATION_PLAN.md for the full gap table and phased checklist.

---

## 3. Other plans (brief)

| Plan | What it is | Implemented? |
|------|------------|---------------|
| **add_setup_guide_to_plan_911f0b06** | Add “Setup and operations” section to main plan | ✅ **Plan doc only:** Section was added to genr8_fitness_app_7f31eaa2.plan.md. The steps described there (DB, auth, seed, route protection) were already implemented in code; the guide now documents them. |
| **lab_text_file_dna_ingestion** | Lab file upload + parse + map to interpretation fields | ✅ Parser (`lib/parseLabFile.ts`), parse-dna-file API, and admin “add DNA result” flow with upload and manual entry. |
| **client_app_everfit_parity** | Client app UX aligned with Everfit/Trainerize | ⚠️ Partially: client programs, results, progress, today, inbox, tasks exist; see Everfit parity doc for remaining gaps. |
| **genr8_codebase_review_and_cleanup** | Review and cleanup tasks | Not mapped here; would require reading that plan and checking each item. |
| **scalable_feature_flags**, **hide_groups_from_nav**, **mvp_epics_and_stories**, **jtbd_meeting_tie-in**, **hippocampus_***, **deliverable_1_***, etc. | Various product/process plans | Not audited in this doc; names suggest strategy/mvp/other projects. |

---

## 4. How to use this doc

- **“What’s actually built?”** → Use Section 1 (main plan) and Section 2 (Everfit parity). Section 1 is the source of truth for “Genr8 Fitness App” scope; Section 2 refines with Everfit-style features.
- **“Was the setup guide implemented?”** → The setup guide is **in the main plan** (Section “Setup and operations”); the **steps** (DB, auth, seed, protection) are **implemented in code**; the guide did not add new code, it added documentation to the plan.
- **“What’s next?”** → Use the main plan Phases 4–5 “partial” items and EVERFIT_PARITY_IMPLEMENTATION_PLAN.md Phase 3+ for remaining work.

**Last updated:** Generated from codebase and plan scan; update this file when completing plan items or adding new plans.
