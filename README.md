# Calorie Counter 🥗

A fast, clean, free calorie & macro tracker you run yourself and install on your
iPhone as a home-screen app (PWA). No App Store, no subscription.

**Features**

- 📊 Daily calorie ring + protein / carb / fat goals
- 🔎 Food search (UK-biased) and 📷 barcode scanning, both via [Open Food Facts](https://world.openfoodfacts.org)
- ✍️ Manual entry for anything not in the database
- ⭐ Favourites + recents for one-tap re-logging
- ☁️ Cloud sync across devices with a private login (Supabase)
- 📱 Installs to your home screen and works offline (PWA)

**Stack:** React + TypeScript + Vite • Tailwind CSS • Supabase (auth + Postgres) •
Open Food Facts • ZXing (barcode) • vite-plugin-pwa.

---

## 1. Set up the database (Supabase — free, ~3 min)

1. Go to [supabase.com](https://supabase.com) and create a free account + new project.
   (Pick a region near you, e.g. *London / eu-west-2*.)
2. Open the project's **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
3. Go to **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **anon public** key (a long `eyJ...` string — *not* the service role key)
4. *(Recommended for personal use)* Under **Authentication → Providers → Email**,
   turn **off** "Confirm email" so you can sign in instantly without a mail step.

## 2. Configure the app

```bash
cp .env.example .env
```

Edit `.env` and paste your two values:

```
VITE_SUPABASE_URL=https://abcd1234.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open the printed URL (e.g. `http://localhost:5173`), create an account, set your
goals, and start logging.

> **Camera/barcode note:** browsers only allow camera access over HTTPS (or on
> `localhost`). Scanning will work locally and on your deployed HTTPS site, but
> not over a plain-HTTP LAN address.

## 4. Deploy + install on your iPhone

The easiest free host is **Vercel**:

1. Push this folder to a GitHub repo.
2. At [vercel.com](https://vercel.com), **New Project → import the repo**.
3. Add the two environment variables (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) in the Vercel project settings.
4. Deploy. You'll get an HTTPS URL like `https://your-app.vercel.app`.

Then on your iPhone:

1. Open the URL in **Safari**.
2. Tap the **Share** button → **Add to Home Screen**.
3. Launch it from the new icon — it runs full-screen like a native app.

(Any static host works — Netlify, Cloudflare Pages, GitHub Pages — as long as
it serves over HTTPS and you set the two env vars at build time.)

---

## Project layout

```
src/
  lib/            supabase client, Open Food Facts API, types, date helpers
  context/        auth provider
  hooks/          TanStack Query data hooks (profile, entries, favourites, recents)
  components/     UI pieces (nav, ring, macro bars, scanner, add-food sheet)
  pages/          Login, Today (dashboard), Add, Settings (goals)
supabase/
  schema.sql      run once in the Supabase SQL editor (tables + row-level security)
scripts/
  gen-icons.mjs   regenerate PWA icons from public/favicon.svg
```

## Notes & ideas for later

- Data is private per user via Postgres **row-level security** — each account only
  ever sees its own rows.
- Open Food Facts is free and community-run; coverage is excellent for UK
  supermarket and packaged products. Anything missing can be added manually.
- Possible future additions: weight tracking, water log, weekly charts, copying a
  previous day, offline write queue, and an Apple Health export.
