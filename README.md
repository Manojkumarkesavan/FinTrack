# FinTrack — Personal Finance Tracker

A production-ready personal finance app built with Next.js 14, Supabase, and Tailwind CSS. Track assets, liabilities, investments, income, expenses, and get AI-powered insights.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, DM Sans + DM Serif Display fonts |
| UI Components | Radix UI primitives, shadcn/ui patterns |
| Charts | Recharts |
| Backend / DB | Supabase (Postgres + Auth + RLS) |
| Auth | Supabase Auth → Google OAuth |
| AI Insights | Claude Haiku (Anthropic API) |
| Forms | React Hook Form + Zod |
| CSV Parsing | Papa Parse |
| Hosting | Vercel (frontend) + Supabase Cloud (DB) |

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd fintrack
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**
3. Paste and run the entire contents of `supabase/schema.sql`
4. Go to **Authentication → Providers → Google** and enable it
5. Add your Google OAuth credentials (see below)

### 3. Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable Google+ API
3. Create OAuth 2.0 credentials (Web application)
4. Authorised redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret into Supabase Auth → Google provider

### 4. Environment variables

```bash
cp .env.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add all environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://fintrack.app`).

---

## Features

### Dashboard
- Net worth overview with MoM change
- Asset allocation donut chart (Equity / Debt / Real Estate / Others)
- Monthly cashflow bar chart (Income vs Expenses)
- Net worth trend line from saved snapshots
- Financial health checks (emergency fund, D/I ratio, equity allocation)

### Assets
- 20+ asset types: savings, FD, stocks, MF, ETF, PPF, EPF, NPS, property, gold, crypto, and more
- Purchase price tracking for P&L calculation
- Grouped by category with sub-totals

### Liabilities
- Home loan, car loan, personal loan, credit card, education loan
- EMI tracking with payoff progress bar
- Months remaining until closure

### Transactions
- Income and expense log with 25+ categories
- Monthly grouping with income/expense summary
- Recurring transaction support
- Filter by type and category

### Investments
- Upload Zerodha Console or Groww holdings CSV
- Auto-parses symbol, quantity, avg cost, LTP
- Unrealised P&L and P&L % per holding
- Grouped by type (Stocks / MF / ETF / US Stocks)

### AI Insights
- 5 insight types: Emergency Fund, Savings Rate, Allocation, Debt, Projection
- Powered by Claude Haiku (fast and cheap — ~₹0.04/insight)
- Cached per user per 24h to minimise API costs

---

## Broker CSV Import

### Zerodha
1. Log in to [console.zerodha.com](https://console.zerodha.com)
2. Portfolio → Holdings → Download CSV

### Groww
1. Log in to [groww.in](https://groww.in)
2. Portfolio → Stocks or Mutual Funds → Download

The CSV is parsed entirely client-side (Papaparse). Raw files are never uploaded — only parsed data reaches the database.

---

## Database Schema

See `supabase/schema.sql` for the full schema. Tables:

- `profiles` — user settings (auto-created on signup via trigger)
- `assets` — all asset holdings
- `liabilities` — loans and credit
- `transactions` — income and expense log
- `investments` — broker-imported holdings
- `networth_snapshots` — monthly NW history
- `insights_cache` — cached AI analysis
- `fx_rates` — FX rate cache

All tables have Row-Level Security enforced with `user_id = auth.uid()`.

---

## Cost at Scale (INR)

| Users | Vercel | Supabase | Claude Haiku | Total |
|---|---|---|---|---|
| 0–50k MAU | Free | Free | ~₹0.04/user/mo | ~₹75/mo (domain) |
| 50k–100k | Free | ₹2,100/mo | ~₹4/user/mo | ~₹2,500/mo |

---

## Roadmap

- [ ] Goals tracker with SIP projections
- [ ] Multi-currency with live FX rates
- [ ] Recurring transaction auto-detection
- [ ] Tax P&L view (STCG / LTCG from broker CSV)
- [ ] Weekly net worth email digest (Resend)
- [ ] PWA / add to home screen
- [ ] Mobile app (Capacitor)
- [ ] Family / couple shared dashboard

---

## License

MIT
