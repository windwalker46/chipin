# ChipIn

ChipIn is a threshold + collective task engine.

Core loop:
1. Create a chip with a threshold and deadline.
2. Share the link and collect commitments.
3. Auto-activate when threshold is hit.
4. Complete objectives together.

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

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS
- Supabase Auth
- Postgres (Supabase)

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

- `/`
- `/auth/sign-in`
- `/dashboard`
- `/chips/new`
- `/chips/[publicCode]`
- `/admin`
- `POST /api/jobs/expire-chips` (requires `x-cron-secret`)

## Notes

- This codebase no longer includes payment flows.
- Keep secrets out of git; never commit `.env.local`.
- Use Supabase transaction pooler for serverless `DATABASE_URL`.
