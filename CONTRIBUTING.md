#+ Contributing

## Quick Start
- Create env file: copy `t3-paridaderisco/.env.example` to `t3-paridaderisco/.env` and fill values below.
- Install and set up DB/app:
  - `cd t3-paridaderisco && npm install`
  - `npm run db:push && npm run db:seed`
  - `npm run dev` (app on http://localhost:3000)

## Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection URL for Prisma.
- `NEXTAUTH_URL`: Public app URL (http://localhost:3000 for local dev).
- `NEXTAUTH_SECRET`: Secret for NextAuth (required for auth; generate with `openssl rand -base64 32`).
- Optionally, provider secrets (e.g., Discord) if enabling social login.

Example `.env` (update credentials as needed):

```
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/paridaderisco"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="paste-a-generated-secret"

# Optional providers
# DISCORD_CLIENT_ID=""
# DISCORD_CLIENT_SECRET=""
```

## Full Guidelines
See AGENTS.md for project structure, scripts, style, testing, and PR/commit conventions.
