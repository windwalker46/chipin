# ChipIn Web (MVP)

Mobile-first Next.js app for pooled food payments with Supabase + Stripe Connect.

## Requirements

- Node 20+
- Supabase project
- Stripe account (platform + Connect enabled)

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CRON_SHARED_SECRET`

`DATABASE_URL` is already configured for your Supabase host; replace password if needed.

## Run

```bash
npm install
npm run db:migrate
npm run dev
```

## Build Checks

```bash
npm run lint
npm run build
```

## Implemented Screens

1. Landing (`/`)
2. Organizer Sign In (`/auth/sign-in`)
3. Connect Stripe (`/onboarding/stripe`)
4. Dashboard (`/dashboard`)
5. Create Pool (`/pools/new`)
6. Organizer Pool View (`/pools/[publicCode]`)
7. Contributor Join (`/join/[publicCode]`)
8. Stripe Checkout (hosted)
9. Contribution Success (`/join/[publicCode]/success`)
10. Expired (`/join/[publicCode]/expired`)
11. Funded (`/join/[publicCode]/funded`)

## API Routes

- Stripe webhook: `POST /api/stripe/webhook`
- Expiration/refund cron: `POST /api/jobs/expire-pools` with header `x-cron-secret`

## Notes

- Platform fee defaults to `2%` (`STRIPE_PLATFORM_FEE_BPS=200`).
- Admin panel is available at `/admin` for emails listed in `ADMIN_EMAILS`.
