# Environment Setup

## Required tools

Install current Node LTS, then run:

```bash
node -v
npm -v
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
npm install -g vercel
```

## Create the new app

```bash
mkdir tiktok-live-sales
cd tiktok-live-sales
pnpm init
cat > pnpm-workspace.yaml <<'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF
mkdir -p apps packages supabase/migrations docs
```

Create web app:

```bash
cd apps
pnpm create next-app@latest web --ts --tailwind --eslint --app --src-dir false --import-alias "@/*"
cd ..
```

Create collector:

```bash
mkdir -p apps/collector/src
cd apps/collector
pnpm init
pnpm add tiktok-live-connector @supabase/supabase-js dotenv zod libphonenumber-js commander pino
pnpm add -D typescript tsx @types/node
cd ../..
```

Create shared package:

```bash
mkdir -p packages/shared/src
cd packages/shared
pnpm init
pnpm add zod libphonenumber-js
pnpm add -D typescript tsx @types/node
cd ../..
```

Install web dependencies:

```bash
cd apps/web
pnpm add @supabase/supabase-js @supabase/ssr zod libphonenumber-js date-fns lucide-react clsx tailwind-merge
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input table badge card dialog sheet select dropdown-menu textarea tabs toast skeleton
cd ../..
```

Root dev dependencies:

```bash
pnpm add -D turbo typescript prettier eslint
```

## Environment files

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEFAULT_COUNTRY=TN
APP_URL=http://localhost:3000
```

Create `apps/collector/.env`:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DEFAULT_COUNTRY=TN
LOG_LEVEL=info
```

## Run locally

Start dashboard:

```bash
pnpm dev:web
```

Start collector example:

```bash
cd apps/collector
pnpm dev -- --username your_tiktok_username --session LIVE_SESSION_ID
```
