# Donor Collection App

A simple Next.js donor management system. No database — data lives in `public/data/donors.csv`.

---

## Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Login page |
| `/dashboard` | Public | Shows total collected & donor count |
| `/collection` | Login required | Full donor table + add donor |

---

## Credentials (hard-coded)

| Username | Password |
|----------|----------|
| `admin` | `admin123` |

To change them, edit the top of `app/page.js`:
```js
const VALID_USER = 'admin'
const VALID_PASS = 'admin123'
```

---

## Data — CSV

Location: `public/data/donors.csv`

```
sn,name,address,tel,amount
1,John Smith,123 Main St,0771234567,5000
```

- `sn` is the unique serial number (auto-incremented on each add)
- **To preserve data across deployments**: before deploying, copy your production CSV and replace `public/data/donors.csv` with it, then deploy.

---

## Local Development

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

---

## Deploy to Firebase Hosting

> ⚠️ Firebase Hosting serves static files. Next.js API routes (used for CSV read/write) require a server.
> Use **Firebase + Cloud Functions** or switch to **Vercel** for full API route support.

### Option A — Vercel (Recommended, easiest)

```bash
npm install -g vercel
vercel login
vercel --prod
```
Vercel natively supports Next.js API routes. Zero config needed.

### Option B — Firebase with Cloud Run (Advanced)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. Initialize project:
   ```bash
   firebase init
   # Choose: Hosting + Functions (or App Hosting)
   # Framework: Next.js
   ```

3. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

### ⚡ Simplest Firebase option — Firebase App Hosting (Beta)

Firebase App Hosting supports Next.js with API routes natively:
```bash
firebase init apphosting
firebase deploy
```

---

## Preserving Data on Each Deploy

Since there's no database, follow this workflow every time you deploy:

1. Download/copy the current `donors.csv` from your server
2. Replace `public/data/donors.csv` with your production file
3. Run `npm run build`
4. Deploy

---

## Changing the Organization Name / Logo

Edit `app/dashboard/page.js` — look for:
```js
<h1 style={s.orgName}>Community Aid Foundation</h1>
<p style={s.tagline}>Every contribution builds a better tomorrow</p>
```

To use a real image logo, replace the `🤝` emoji div with an `<img>` tag.
