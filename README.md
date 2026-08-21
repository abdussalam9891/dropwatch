# DropWatch

Track product prices across e-commerce sites and get notified when they drop.

## Live Demo
[get-dropwatch.vercel.app](https://get-dropwatch.vercel.app)

## Tech Stack
- Next.js (App Router)
- Firecrawl — web scraping with anti-bot bypass
- Supabase — PostgreSQL database, auth, pg_cron
- Resend — email alerts
- Recharts — price history charts
- shadcn/ui + Tailwind CSS

## Features
- Add any product URL and track its price
- Interactive price history charts
- Google OAuth authentication
- Automated daily price checks via cron
- Email alerts when price drops

## Run Locally
git clone https://github.com/you/dropwatch
cd dropwatch
npm install
cp .env.example .env.local
# fill in your env vars
npm run dev
