# M-Pesa Daraja production setup

This app is wired for **production** Daraja only (`https://api.safaricom.co.ke`) —
there is no sandbox fallback in the code (`src/lib/daraja.ts` hardcodes the
base URL). Nothing will process a real payment until the env vars below are
set with real credentials from Safaricom.

## What you need from Safaricom

1. **A Daraja account** — register at https://developer.safaricom.co.ke.
2. **Your Till number (Buy Goods)** — the existing till your business uses to
   receive payments. This becomes `MPESA_SHORTCODE`. The integration uses
   `TransactionType: CustomerBuyGoodsOnline`, so this must be a Till, not a
   Paybill.
3. **Lipa Na M-Pesa Online (STK Push) API access for that till**, via
   Safaricom's go-live process. This typically requires:
   - Business registration documents
   - Till number certificate / proof of ownership
   - A completed API testing period against Safaricom's sandbox
   - Signing Safaricom's API agreement
4. Once approved, Safaricom issues:
   - **Production Consumer Key & Secret** for your go-live app (different
     from any sandbox app's credentials) → `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET`
   - **The Lipa Na M-Pesa Online Passkey** tied to your shortcode → `MPESA_PASSKEY`

## Env vars to set

| Variable | Value |
|---|---|
| `MPESA_CONSUMER_KEY` | Production consumer key from your go-live Daraja app |
| `MPESA_CONSUMER_SECRET` | Production consumer secret |
| `MPESA_SHORTCODE` | Your Till number |
| `MPESA_PASSKEY` | Lipa Na M-Pesa Online passkey for that till |
| `NEXT_PUBLIC_SITE_URL` | Your real production HTTPS domain — used to build the STK push `CallBackURL`, which Safaricom POSTs to directly |
| `CRON_SECRET` | Any random string — protects `/api/cron/subscriptions` |

## Before going live

- `NEXT_PUBLIC_SITE_URL` must point at a **publicly reachable HTTPS** domain
  — Safaricom cannot reach `localhost`, so the callback route
  (`/api/payments/mpesa/callback`) can only be exercised end-to-end from a
  real deployment.
- Run `npx prisma migrate deploy` against your production database before
  deploying this code — the `Subscription`/`Payment`/`Notification` tables
  and the `Plan`/`SubscriptionStatus`/etc. enums must exist first. This
  sandbox has no reachable database, so that migration has only been
  hand-authored (`prisma/migrations/20260721084616_add_payments_subscriptions_notifications/`)
  and generated against locally, never applied to a real database.
- Confirm your Vercel plan includes cron jobs at the frequency configured in
  `vercel.json` (daily) — cron is plan-gated on some tiers.
- Double-check `TransactionType` stays `CustomerBuyGoodsOnline` in
  `src/lib/daraja.ts` — using `CustomerPayBillOnline` against a Till number
  is a common integration bug that causes STK pushes to fail or post to the
  wrong account.
- The STK push password's `Timestamp` is computed in Africa/Nairobi (UTC+3)
  regardless of server timezone — if you ever see auth-looking failures from
  `/mpesa/stkpush/v1/processrequest`, check this first (`getDarajaTimestamp()`
  in `src/lib/daraja.ts`).

## What "go live" actually turns on in this app

- `/upgrade` lets a signed-in user pick Monthly (KES 149) or Yearly (KES
  1,499) and pay via an M-Pesa STK push to your till.
- On a successful payment, `POST /api/payments/mpesa/callback` (Safaricom's
  webhook) activates/extends the user's `Subscription` and sets `User.plan`
  to `PRO`.
- Access control (`src/lib/plan.ts`) always re-checks
  `Subscription.currentPeriodEnd` live — it never trusts a cached flag — so
  a lapsed subscription immediately locks any books beyond the free
  10-book limit (oldest-first stay unlocked), even before the daily cron
  sweep (`/api/cron/subscriptions`, see `vercel.json`) has run.
- That same cron job creates a reminder notification a few days before
  expiry, and flips lapsed subscriptions to `EXPIRED` / `User.plan` back to
  `FREE` for data-at-rest cleanliness. Users see these on `/notifications`.

## Testing without production credentials yet

There is no built-in sandbox mode in this codebase (by design — the
requirement was "fully prod", no test-mode toggle). If you want an
end-to-end smoke test before your Till's go-live is approved, you'd need to
temporarily point `DARAJA_BASE_URL` in `src/lib/daraja.ts` at
`https://sandbox.safaricom.co.ke` and use Safaricom's sandbox test
shortcode/passkey — treat this as a throwaway local experiment only, and
revert it before deploying.
