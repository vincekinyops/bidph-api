# BidPH API

Backend for BidPH: **Supabase** (Postgres, migrations, Auth project config), and (planned) **Hono** + **Drizzle** for REST, webhooks, and privileged operations.

The web app lives in [`../bidph`](../bidph). Specs: [`../docs/`](../docs/).

## Prerequisites

- Node.js 20+
- [Docker](https://www.docker.com/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

```bash
brew install supabase/tap/supabase
```

## Local Supabase

All schema migrations, seed, and `supabase` CLI commands run from **this repo**.

```bash
cd bidph-api
pnpm db:start          # or: supabase start
pnpm db:status         # human-readable table
pnpm db:env            # copy-paste env (PUBLISHABLE_KEY, SECRET_KEY, …)
cp .env.example .env   # map SECRET_KEY → SUPABASE_SECRET_KEY
```

Reset DB and re-apply migrations + seed hook:

```bash
pnpm db:reset
```

Demo auction rows (after at least one user exists in **bidph** web):

```bash
pnpm db:seed-items
```

Admin helper SQL: [`supabase/scripts/create-admin.sql`](./supabase/scripts/create-admin.sql).

## Configure the web app

In **bidph** `web/.env.local`:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY from pnpm db:env>
```

Do **not** put `SUPABASE_SECRET_KEY` or `PAYMONGO_WEBHOOK_SECRET` in the web repo.

## Layout

```
bidph-api/
├── supabase/
│   ├── config.toml
│   ├── migrations/     # DDL source of truth
│   ├── seed.sql
│   └── scripts/
├── package.json        # db:* scripts
└── .env.example
```

### API server (Hono)

**Node (local):**

```bash
cp .env.example .env   # fill SUPABASE_URL + SUPABASE_SECRET_KEY from pnpm db:env
pnpm dev               # http://localhost:3001
```

**Cloudflare Worker (local, matches production runtime):**

```bash
cp .dev.vars.example .dev.vars   # same keys as .env
pnpm dev:worker                  # http://localhost:3001
```

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Liveness |
| `GET /api/v1/me` | Current user profile (Bearer JWT) |
| `POST /api/v1/webhooks/paymongo` | PayMongo cash-in webhook |

See [spec-v1-plan2.md](../docs/spec-v1-plan2.md) for the full roadmap.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm db:start` | Start local Supabase stack |
| `pnpm db:stop` | Stop local Supabase |
| `pnpm db:reset` | Reset DB, run migrations + seed |
| `pnpm db:status` | Show URLs and keys |
| `pnpm db:push` | Push migrations to linked remote project |
| `pnpm db:seed-items` | Insert demo auctions (local) |
| `pnpm db:seed-items:remote` | Demo auctions on linked project |
| `pnpm dev:worker` | Local API on Cloudflare Workers runtime |
| `pnpm deploy` | Deploy API to Cloudflare Workers |

## Production

- Deploy schema with `pnpm db:push` from this repo (linked project).
- Never run `db:reset` on production.
- Service role, `DATABASE_URL`, PayMongo secrets belong here only.

### Cloudflare Workers

**Manual deploy**

1. Log in: `pnpm wrangler login`
2. Set bindings: `pnpm wrangler secret put SUPABASE_URL` (and `CORS_ORIGIN`, `SUPABASE_SECRET_KEY`, etc.)
3. Deploy: `pnpm deploy`

**CI deploy (push to `main`)**

GitHub Actions workflow: [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). On every push to `main`, it runs `pnpm typecheck` then `wrangler deploy`.

Add these **repository secrets** in GitHub (Settings → Secrets and variables → Actions):

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | [API token](https://dash.cloudflare.com/profile/api-tokens) with **Workers Scripts → Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID (dashboard sidebar) |
| `SUPABASE_URL` | Production project URL, e.g. `https://<ref>.supabase.co` |
| `SUPABASE_SECRET_KEY` | Service role / secret key (`sb_secret_...`) |
| `CORS_ORIGIN` | Production web app URL |
| `PAYMONGO_WEBHOOK_SECRET` | Optional — set via `pnpm wrangler secret put` if not in GitHub |
| `CRON_SECRET` | Optional — same as above |

PayMongo webhook URL: `https://<your-worker>.workers.dev/api/v1/webhooks/paymongo`

Node (`pnpm dev`) remains available for quick local iteration; `pnpm dev:worker` uses the same Hono app on the Workers runtime.
