# CLAUDE.md — Project Journal

Living context file for this project. Read this first in any new session to know what this project is, what's decided, and where we left off.

## What this is

A home-assignment fullstack project (job application): a real-time social network with auth, friends graph, posts with visibility rules, personalized feed, comments, and real-time updates via Socket.IO. Full requirements in `instructions.md` at repo root.

Team lead (the user) owns major design decisions; the AI does all implementation and drives the day-to-day sequencing. Timeline: short, 2-4 days.

## Locked-in decisions (do not revisit without asking the user)

- **Database**: PostgreSQL, self-hosted via Docker (no external accounts, keeps `docker compose up` fully self-contained — chosen explicitly over Supabase for this reason)
- **ORM**: Prisma
- **Auth**: server-side sessions stored in Postgres via `connect-pg-simple` (not JWT); httpOnly/secure/sameSite cookie holds only the session ID
- **Language**: TypeScript on both backend (Express) and frontend (React)
- **Styling**: Tailwind CSS
- **Frontend state**: React Query for server state, plain React Context for auth/socket state (no Redux/Zustand)
- **Real-time**: Socket.IO, single instance, auth via shared session cookie (no separate token)
- **Testing**: minimal, targeted unit tests only on security/authorization-critical logic (friend-request state machine, post visibility resolution, ownership middleware) — no UI test suite
- **Bonus** (private messaging): attempt only after core (phases 1-10) is fully solid and polished
- **GitHub repo**: public

Full technical design (schema DDL, API endpoint list, Docker Compose layout, real-time room strategy) lives in the approved plan; this file tracks living status, not the static design.

## Build sequence (11 phases, see full plan for detail)

0. Fix git repo scope + GitHub repo setup
1. Scaffolding & Docker skeleton
2. DB schema & migrations
3. Auth (register/login/logout, sessions, bcrypt, targeted tests)
4. Profiles (public view + owner-only edit)
5. Friends system (request/accept/reject/cancel/remove + state-machine tests)
6. Posts + visibility (CRUD + ownership + visibility tests)
7. Feed + cursor pagination
8. Comments + realtime comments
9. Posts realtime (feed fan-out)
10. Polish: README, ERD export, security pass
11. (Stretch) Bonus: private messaging

## Status

**Current phase: 0 (git setup) — in progress.**

- [x] Diagnosed and fixed a stray `.git` at the user's home directory root (was empty, no history — safely deleted); reinitialized git scoped correctly to this project folder, default branch `main`.
- [ ] Create GitHub repo (public), add remote, push initial commit.
- [ ] Phase 1: scaffolding & Docker skeleton — not started.

## Notes / gotchas for future sessions

- User's fullstack experience is thin (comfortable with JS/HTML/CSS basics, not prior fullstack project experience). Explanations to the user should stay plain-language; technical rigor belongs in code/plan/README, not necessarily in every chat message.
- No `gh` CLI available in this environment — GitHub repo creation and any GitHub web actions go through the user manually; guide them step by step.
- Global git identity already configured: user.name `Jonathan`, user.email `yonatanorsh@mail.tau.ac.il`. No credential helper was set at the global level — if HTTPS push prompts for auth, Git Credential Manager (bundled with Git for Windows) should handle it via browser login.
