# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CryptoTrade frontend — a React 18 + TypeScript + Vite SPA for a crypto trading platform. It is **frontend-only**; all business logic and money live in a separate backend API (default `https://cryptoapp-api.onrender.com`, overridable via `VITE_API_URL`). The app has two halves sharing one codebase and one router: the **user app** (trading, wallet, KYC, profile) and an **admin/subadmin panel** (`/admin/*`) for user management, deposits/withdrawals, risk, coins, and site settings.

Trading has two flavors: **binary options** (UP/DOWN predictions, `tradeService` → `/api/trades/*`) and **spot** (`spotTradeService` → `/api/spot/*`, incl. limit/stop orders). Markets span crypto, stocks, forex, and metals.

## Commands

```bash
npm run dev        # Vite dev server on http://localhost:3001 (strict port), proxies /api -> localhost:3000
npm run build      # tsc (typecheck) + vite build -> dist/
npm run preview     # serve the production build
npm run lint         # eslint --ext ts,tsx --max-warnings 0 (0 warnings enforced)
```

There is **no test runner** configured. `npm run build` is the effective correctness gate: it runs `tsc` under strict mode with `noUnusedLocals`/`noUnusedParameters`, so unused vars fail the build. `build_errors.txt` in the root is a stale scratch log, not part of tooling.

## Environment

- `VITE_API_URL` — backend base URL. In dev, leave unset to use the Vite `/api` proxy to `localhost:3000`; the axios client's `baseURL` is this value (default the Render URL). Note service paths already start with `/api/...`, so the proxy match is on `/api`.
- `VITE_SITE_URL` — origin for resolving relative media/upload paths (`resolveMediaUrl`) and SEO; falls back to `VITE_API_URL`.

Deploys to Vercel (`vercel.json` rewrites all routes to `/index.html` for SPA routing).

## Architecture

### Layers

```
pages/  ->  services/  ->  axios `api`  ->  backend
components/ (presentational + shell)      contexts/ (global state)
```

- **`src/services/`** is the entire data layer. Each service is a plain object of async functions wrapping the shared axios instance (`services/api.ts`). Services own request/response shapes and **normalize backend payloads** into the app's `types/` (e.g. `normalizeDeposit`, `toCoin`) — backend fields are inconsistent (`_id`/`id`, `change24h` may be missing), so always go through a normalizer rather than trusting raw JSON. Never call `axios` directly from a component/page; add or extend a service.
- **`src/pages/`** — one component per route (see `App.tsx`). Admin pages are the `Admin*.tsx` set.
- **`src/components/`** — shared UI. `components/layout/` holds the authenticated **AppShell** (TopBar, SideDrawer, BottomNav, `navItems.ts`); `AdminLayout.tsx` is the admin chrome.
- **`src/contexts/`** — `AuthContext` (session + user), `ThemeContext` (dark/light), `SiteSettingsContext` (branding/config pulled from the backend). All three wrap the app in `App.tsx` in that nesting order.

### Routing & guards (`src/App.tsx`)

All routes live in one `<Routes>`. Public routes (landing, auth, legal) are top-level. Authenticated user routes are nested under `<ProtectedRoute><AppShell/></ProtectedRoute>`. Admin routes are under `<ProtectedRoute><AdminRoute><AdminLayout/></AdminRoute></ProtectedRoute>` at `/admin/*`. Legacy paths (`/login`, `/register`, `/app/*`, `/subadmin/*`) are `<Navigate>` redirects — preserve these when touching routing. Unknown paths redirect to `/`.

### Auth & session (critical, do not casually change)

Session state is centralized in **`services/sessionManager.ts`** — a singleton over `localStorage` (key `crypto_auth_session`), *not* React state. `AuthContext` subscribes to it. Key behaviors:

- Stores access + refresh tokens; decodes JWT `exp` to know when to refresh.
- Enforces **idle timeout** (30 min) and **absolute timeout** (7 days); user activity (`touchActivity`) resets idle.
- **Cross-tab sync** via `storage` events + `BroadcastChannel` — signing out in one tab signs out all.
- `services/api.ts` interceptors auto-attach `Bearer` tokens, refresh on expiry (deduped via a single in-flight `refreshPromise`), retry once on 401, and redirect to `/signin` (or `/admin/signin`) on failure. `PUBLIC_PATHS` (coins/market/metals/public settings) skip auth entirely.

When adding auth-affecting logic, route it through `sessionManager` and the interceptors — don't read tokens from `localStorage` directly in components.

### Market/price data

- **`marketDataService.ts`** is the canonical market feed: pulls from the backend, merges with `data/placeholderCoins.ts` (`FALLBACK_COINS`) so the UI always renders, and resolves icons via `utils/coinIcons.ts`.
- **`cryptoWebSocket.ts`** + `hooks/useCryptoWebSocket.ts` stream live prices directly from **Binance** (a `symbolMap` translates CoinGecko-style ids → Binance `*USDT` pairs), with auto-reconnect. `binanceService`/`binanceQuotes` are REST fallbacks. These external market feeds are independent of the app's own backend.

### Conventions

- **Money/prices are plain `number`s here** (this is a display client); the backend is the source of truth for balances and settlement. Format via `utils/format.ts`.
- `utils/protectedOwner.ts` hard-codes an owner email that must never be deletable/demotable — respect this guard in any admin user-management UI.
- Path style is relative imports (`../services/...`); there are no path aliases.
- `@typescript-eslint/no-explicit-any` is `warn`, but lint runs with `--max-warnings 0`, so effectively `any` breaks CI — type it.
