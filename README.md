# Donor Collection App

A Next.js donor management system. Data is stored in PostgreSQL through Prisma, and the app is deployed on Vercel.

Donors are grouped into year tabs (2026, 2027, …).

| Who | Can do |
|-----|--------|
| Anyone | View every year tab, search, export CSV |
| Signed-in admin (`/login`) | Also add, edit and delete donors, and add year tabs |

Sign-in is checked on the server: the write API routes reject requests without a valid session cookie.

## Admin login

Defaults to `admin` / `admin123`. Override with environment variables (set them in Vercel → Settings → Environment Variables):

| Variable | Purpose |
|----------|---------|
| `ADMIN_USER` | Username |
| `ADMIN_PASSWORD` | Password |
| `AUTH_SECRET` | Long random string used to sign the session cookie |

## Database

Schema: `prisma/schema.prisma` (`Donor` with a `year`, and `Year` for the tabs).

Vercel's filesystem is read-only, so use a hosted Postgres (Vercel Postgres / Neon, Supabase, etc.).

## Local development

```bash
npm install
# put your connection string in .env
#   POSTGRES_URL="postgres://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
npm run db:push     # creates / updates the tables
npm run db:seed     # loads 2025donors.csv into 2025 (skips if 2025 already has data); 2026 stays empty
npm run dev         # http://localhost:3000
```

## Deploy to Vercel

1. In the Vercel project: Storage → create a Postgres (Neon) database and connect it to the project. This sets `POSTGRES_URL`, which `prisma/schema.prisma` reads.
2. Create or update the tables from your machine with the production `POSTGRES_URL`: `npm run db:push`.
3. Deploy: `vercel --prod` (or push to the connected Git repo). `npm run build` runs `prisma generate` automatically.
