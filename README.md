# ChipIn

A group coordination app where collective tasks only activate once enough people commit. No more "who's in?" group chat chaos.

**[Live App](https://chipin-opal.vercel.app/)**

## How It Works

1. Create a chip with a threshold (minimum participants) and a deadline.
2. Share the link. Anyone can join without creating an account.
3. When the threshold is hit, the chip auto-activates and objectives unlock.
4. Complete objectives together. If the deadline passes without enough commitments, the chip expires automatically.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS
- Supabase Auth
- Postgres (Supabase)

## Product Modes

### Free Chip (Current)

- 1 pending/active chip per creator
- Public link sharing
- Threshold + deadline
- Up to 5 objectives
- Join without account required
- Auto-activation and auto-expiration

### Power Chip (Planned)

- Unlimited objectives
- Recurring chips
- Private / invite-only chips
- Objective assignment
- Smart reminders
- Completion summary

---

## Local Setup

1. `npm install`
2. Copy env template to `.env.local`
3. `npm run db:migrate`
4. `npm run dev`

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `CRON_SHARED_SECRET`
- `APP_URL` (optional in production; falls back to `VERCEL_URL`)
- `ADMIN_EMAILS` (comma-separated allowlist)

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run db:migrate`

## Key Routes

- `/` — Landing page
- `/auth/sign-in` — Authentication
- `/dashboard` — User dashboard
- `/chips/new` — Create a new chip
- `/chips/[publicCode]` — Public chip page
- `/admin` — Admin panel
- `POST /api/jobs/expire-chips` — Cron endpoint (requires `x-cron-secret`)

## Notes

- This codebase no longer includes payment flows.
- Keep secrets out of git; never commit `.env.local`.
- Use Supabase transaction pooler for serverless `DATABASE_URL`.
