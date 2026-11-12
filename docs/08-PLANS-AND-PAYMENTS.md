# 08 - Plans and payments (proposal, needs the owner's decision)

Status: only one rule is built today: **AI writing is Pro only**. Everything else here is a proposal. When the owner decides, the chosen limits go into `src/lib/plans.ts` and the database.

## Principles
1. **Free must be good enough to publish a real portfolio.** People share free pages, and every shared page with the badge is advertising.
2. **Charge for what costs us money or saves people real time:** AI, more pages, custom domains, removing the badge, the downloadable file.
3. **Never hold content hostage.** If Pro ends, pages stay online on the free limits; nothing is deleted.

## Proposed plans

| | Free | Pro |
|---|---|---|
| Portfolios (drafts) | 3 | Unlimited |
| Published portfolios | 1 | 10 |
| All 6 designs, 39 sections, 24 palettes | Yes | Yes |
| Arabic and English | Yes | Yes |
| Link | `/p/your-name` | `/p/your-name` + own domain (later) |
| "Made with Portfolio Maker" badge | Shown | Removed |
| Image uploads | 50 MB | 2 GB |
| Contact form inbox | Yes, 50 messages a month | Unlimited |
| Visits | Total for 30 days | Per day, sources, 12 months |
| Version history | Last 5 | Last 30 |
| Download HTML | No | Yes |
| AI writing | No | 50 uses a day |
| PDF CV (later) | No | Yes |
| Password-protected page (idea) | No | Yes |

A third plan can come later for agencies: many client portfolios, client hand-off, no branding anywhere.

## Prices to consider
Two price lists, because local and international buyers pay differently:
- **Egypt (EGP):** about 150 EGP a month, or about 1,200 EGP a year (two months free). Also prepaid passes: 3 months, 6 months, 12 months.
- **Everywhere else (USD):** about 5 USD a month or 48 USD a year.
- **Students:** half price with a university email, or a free Pro year for graduation projects (good word of mouth).
- **Launch offer:** first 500 accounts get Pro for life at the yearly price once.

Prices are a guess to start the discussion; test them with the first real users.

## The Egypt-specific point
Many people in Egypt pay with **mobile wallets (Vodafone Cash and others), Fawry kiosks or InstaPay**, not cards. Those methods do not renew by themselves. So offer two ways to buy Pro:
- **Subscription** (renews automatically): cards only.
- **Prepaid pass** (3, 6 or 12 months, no renewal): cards, wallets and kiosks. Send a reminder email 7 days before it ends.

## Payment providers

| Provider | Good for | Notes |
|---|---|---|
| **Paymob** (Egyptian) | Egyptian customers in EGP | Cards (including Meeza), mobile wallets, kiosk payments, installments. Has a subscriptions API for recurring card payments. Needs Egyptian business papers to open an account. |
| **Lemon Squeezy** (merchant of record) | International customers in USD | Handles sales tax and VAT worldwide for you; cards and PayPal. Lists Egypt for bank payouts. Fees are higher than a plain gateway (check its current pricing). |
| **Paddle** (merchant of record) | International, larger scale | Like Lemon Squeezy; Egypt is not on its excluded list. Stricter approval. |
| **Stripe** | Not an option for now | Stripe does not open accounts for businesses based in Egypt. |

**Recommendation:** start with **Paymob** for Egypt (subscription for cards, prepaid passes for wallets and kiosks). Add **Lemon Squeezy** when international sales matter. Build the code so the provider is a detail: one subscriptions table, one webhook per provider.

## How it would be built (after the decision)
1. **Database (new migration):** a `subscriptions` table: account, provider, provider reference, plan, status, `current_period_end`. The account's plan is "pro" while `current_period_end` is in the future. People still cannot change their own plan.
2. **Checkout:** a "Go Pro" page with the two price lists. The server creates a checkout with the provider and sends the person there.
3. **Webhooks:** `/api/billing/paymob` (and later `/api/billing/lemonsqueezy`) checks the provider's signature, then records the payment with a server-only Supabase key. Payments are only trusted from webhooks, never from the browser.
4. **Account page:** current plan, renewal or end date, receipts, cancel.
5. **Enforce limits** from the table above in `src/lib/plans.ts` and in the database functions (publishing, uploads, AI).
6. **Emails:** receipt, renewal reminder, pass ending soon.

## Decisions needed from the owner
1. The Free and Pro limits (accept, change or remove rows above).
2. Prices in EGP and USD, and whether to offer prepaid passes.
3. Payment provider to start with (recommended: Paymob), and whether the business papers it needs are ready.
4. Whether to add an agency plan later.
