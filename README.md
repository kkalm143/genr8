# Genr8

Science-based fitness and training, powered by your genetics.

## Setup

1. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `DATABASE_URL` – your PostgreSQL connection string (e.g. from [Neon](https://neon.tech))
   - `NEXTAUTH_SECRET` – run `openssl rand -base64 32` to generate
   - `NEXTAUTH_URL` – `http://localhost:3000` for local dev
   - `BLOB_READ_WRITE_TOKEN` – (optional) Vercel Blob token for admin DNA lab file uploads; if unset, uploads are disabled

2. **Install dependencies** (if not already)
   ```bash
   npm install
   ```

3. **Create the database schema**
   ```bash
   npm run db:migrate
   ```
   (Or `npx prisma db push` for a quick sync without migration history.)

4. **Create the first admin user**
   ```bash
   npm run db:seed
   ```
   Default: `admin@genr8.com` / `changeme123`. Override with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

5. **Run the app**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Log in as admin and go to `/admin`, or sign up as a client and use `/dashboard`.

## Scripts

- `npm run dev` – start dev server
- `npm run build` – build for production
- `npm run start` – start production server
- `npm run test` – run tests
- `npm run test:coverage` – run tests with coverage
- `npm run db:generate` – generate Prisma client
- `npm run db:migrate` – run migrations
- `npm run db:seed` – seed first admin user
- `npm run db:push` – push schema to DB without migrations

## Branding (GNR8)

The app uses a teal color palette inspired by [gnr8.org](https://www.gnr8.org/). Per the plan:

- **Logo**: Use the GNR8 logo from [gnr8.org](https://www.gnr8.org/) or from Nicole in the app header, login/landing, and favicon. The repo currently uses a generated "G" favicon (`app/icon.tsx`). To use the real logo: add the logo asset (e.g. `public/logo.svg` or from the site) and update the header/layout and replace `app/icon.tsx` or reference the logo in metadata.
- **Colors**: Primary brand colors are in `app/globals.css` as CSS variables (`--brand`, `--brand-hover`). Adjust these to match extracted colors from gnr8.org if needed.
