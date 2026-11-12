# 08 - Plans and payments

Decided on 13 November 2026 and built. Limits live in `src/lib/plans.ts` and are enforced by the database (`supabase/migrations/0004_plans_and_billing.sql`); a test fails if the two disagree.

## Plans

| | Free | Pro |
|---|---|---|
| Portfolios | 3 | Unlimited |
| Published pages | 1 | 10 |
| All 6 designs, 39 sections, 24 palettes | Yes | Yes |
| Arabic and English | Yes | Yes |
| "Made with Portfolio Maker" badge | Shown | Removed |
| Image storage | 50 MB | 2 GB |
| Contact form messages | 50 a month (later ones are kept, locked until Pro) | Unlimited |
| Visits | Last 30 days | Last 30 days (per-day detail is a later task) |
| Version history | Last 5 | Last 30 |
| Download HTML | No | Yes |
| AI writing | No | 50 uses a day |
| Custom domain, PDF CV, password-protected page | Later | Later |

**Principle:** nothing is held hostage. When Pro ends the account is Free again: nothing is deleted, published pages stay online, and the free limits only stop new things (a 4th portfolio, a 2nd published page, more uploads).

**Where limits are enforced:** portfolios, published pages, storage, versions, messages, badge and AI are enforced by the database and cannot be bypassed. Download HTML is built in the browser, so its Pro check is in the app only; someone technical could get around it. Locked messages are hidden by the app; their owner could read them through the API. Both are acceptable for now.

## Price and how people pay
- **250 EGP or 6 USD a month**, bought as prepaid months: 1, 3, 6 or 12. Straight multiples, no discount yet; change `MONTHLY_PRICE` or add a yearly discount in `src/lib/plans.ts` (and the `months` list in the migration if new lengths are added).
- **Nothing renews by itself.** This works with every Paymob method: cards, mobile wallets, kiosks. Auto-renewing card subscriptions can come later.
- Buying more months while Pro adds them after the current end date.
- Pro can also be given by hand in the SQL editor with no end date (see `docs/07-SUPABASE-SETUP.md`).

## Payment flow (Paymob)
1. `/pro` shows the table, months and currency. "Pay" calls `/api/billing/checkout`.
2. The server works out the price itself, records a pending payment, and creates a Paymob **intention** (`POST /v1/intention/`) with the payment's id as `special_reference`. It sends the person to Paymob's unified checkout.
3. Paymob calls `/api/billing/paymob` when the payment finishes. The server checks the **HMAC signature** (SHA-512 over Paymob's listed fields, with the HMAC secret). Only then does the database function `apply_paid_payment` mark the payment paid and add the months, and only if the amount and currency match the order exactly. A second call for the same payment changes nothing.
4. Paymob sends the person back to `/pro/done`, which waits for step 3 and shows the result.

The browser never decides that a payment succeeded; only a signed callback from Paymob can.

The Paymob addresses (`https://accept.paymob.com/v1/intention/` and the `https://eg.checkout.paymob.com/` checkout) come from Paymob's documentation and can be changed with `PAYMOB_API_URL` and `PAYMOB_CHECKOUT_URL` if Paymob gives you different ones. They have not been tried against Paymob itself yet; the first test with Paymob's test keys will confirm them.

## Refunds
The refund page (`/refunds`) offers a full refund within 14 days of the first purchase, and always for double or mistaken charges. Refunds are made by hand in the Paymob dashboard; then set the payment's `status` and the account's `pro_until` back in Supabase. This rule is a suggested default for the owner to confirm.

## Not built yet
- Refunds from the app (today: by hand in Paymob, see above).
- Auto-renewing card subscriptions (Paymob subscriptions API).
- Receipts (the account page already lists payments).
- Emails: receipt, "Pro ends in 7 days".
- Per-day visit charts for Pro.
- International buyers through a merchant of record (Lemon Squeezy) if USD through Paymob is not enough.
