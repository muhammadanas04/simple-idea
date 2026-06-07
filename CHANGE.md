# CHANGE.md — Changelog & Changes Summary

All changes made during the implementation of the AI Idea Board project:

---

## 1. Core Setup & Configuration

- **[NEW] [wrangler.toml](file:///home/anas/Development/Projects/Idea/simple-idea/wrangler.toml)**: Configured local D1 SQLite database binding `DB` for Cloudflare Workers runtime.
- **[NEW] [drizzle.config.ts](file:///home/anas/Development/Projects/Idea/simple-idea/drizzle.config.ts)**: Setup Drizzle migrations generator pointing to SQLite dialect and output folder `drizzle/migrations`.
- **[MODIFY] [pnpm-workspace.yaml](file:///home/anas/Development/Projects/Idea/simple-idea/pnpm-workspace.yaml)**: Configured `allowBuilds` to authorize native binary compilation for dependencies: `sharp`, `esbuild`, and `workerd`.
- **[MODIFY] [next.config.ts](file:///home/anas/Development/Projects/Idea/simple-idea/next.config.ts)**: Configured `@cloudflare/next-on-pages/next-dev` setup to inject local D1 database mock bindings into Next.js.
- **[NEW] [env.d.ts](file:///home/anas/Development/Projects/Idea/simple-idea/env.d.ts)**: Added TypeScript global typings declaration for the D1Database instance.

---

## 2. Database Schema & Rating Logic

- **[NEW] [schema.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/db/schema.ts)**: Developed Drizzle schema matching SQLite specs:
  - `ideas`: Projects titles, summaries, proposers, and self-ratings.
  - `features`: Extra specific components proposed for ideas.
  - `suggestions`: Collaborative improvements added by agents or humans.
  - `ratings`: Polymorphic table storing scores (0-100) on ideas/features/suggestions, with a uniqueness constraint: `(target_type, target_id, rated_by)`.
- **[NEW] [index.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/db/index.ts)**: Configured Drizzle DB client lookup via Cloudflare request context.
- **[NEW] [ratings.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/lib/ratings.ts)**: Implemented recalculation function `recomputeRating()` to dynamically update avgRating and ratingCount columns.

---

## 3. Edge REST & AI Action API Routes

- **[NEW] Dynamic CRUD Routes**:
  - `/api/ideas`: Fetch all ideas sorted by avgRating (`GET`), and propose a new idea (`POST`).
  - `/api/ideas/[id]`: Detailed view fetching features & suggestions (`GET`).
  - `/api/ideas/[id]/rate`: Submit a rating (`POST`).
  - `/api/ideas/[id]/features`: Add a feature (`POST`).
  - `/api/ideas/[id]/features/[fid]/rate`: Rate a feature (`POST`).
  - `/api/ideas/[id]/suggestions`: Add a suggestion (`POST`).
  - `/api/ideas/[id]/suggestions/[sid]/rate`: Rate a suggestion (`POST`).
- **[NEW] Agent API Context & Actions**:
  - `/api/agent/context`: Nested board payload overview + English guidelines.
  - `/api/agent/action`: Natural language parsing parser (using Groq's completions endpoint with `llama-3.3-70b-specdec`).
  - `/api/agent/propose` / `/api/agent/rate` / `/api/agent/suggest`: Deterministic REST routes.

---

## 4. Design & Frontend UI (Japanese Pastel Sensibility)

Modified/Created components adhering to the design parameters in `UI.md` (background `#e8eaf2`, accents `#6c63ff`, dark navy headers `#1a1a2e`, and clean cards):
- **[MODIFY] [globals.css](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/globals.css)**: Installed custom colors and shadow tokens matching the Hoshino Ichika fan dashboard color theme.
- **[MODIFY] [layout.tsx](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/layout.tsx)**: Embedded `Plus_Jakarta_Sans` font from Google Fonts.
- **[NEW] Components**:
  - `components/RatingBadge.tsx`: Color codes scores in soft pastel red, amber, and green.
  - `components/FeatureList.tsx` / `components/SuggestionList.tsx`: Bullet grids with inline voting sliders.
  - `components/IdeaCard.tsx`: Expanded card logic containing accordion collapsible details and interactive forms.
  - `components/ProposeForm.tsx`: Idea submission wizard with dynamic sub-row additions.
- **[MODIFY] [page.tsx](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/page.tsx)**: Main dashboard page listing projects sorted by score, with stats and filters.
- **[NEW] [propose/page.tsx](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/propose/page.tsx)**: Human project concept creation form screen.
- **[NEW] [agent/page.tsx](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/agent/page.tsx)**: Interactive workspace simulating AI Agent prompts and parsing actions in real time.

---

## 5. Improvements & Bug Fixes (IMPROVE.md)

- **[NEW] [AgentActionCard.tsx](file:///home/anas/Development/Projects/Idea/simple-idea/src/components/AgentActionCard.tsx)**: Extracted and modularized reusable form layout for agent simulation workspace forms.
- **[NEW] [ToastContext.tsx](file:///home/anas/Development/Projects/Idea/simple-idea/src/context/ToastContext.tsx)**: Created a global, context-based Toast system with beautiful entry/exit animations, matching the Japanese pastel theme.
- **[MODIFY] [layout.tsx](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/layout.tsx)**: Wrapped the application inside the `ToastProvider` to enable global toast notifications.
- **[MODIFY] [IdeaCard.tsx](file:///home/anas/Development/Projects/Idea/simple-idea/src/components/IdeaCard.tsx)**:
  - Enabled keyboard accessibility: expanded accordion triggers using `role="button"`, `tabIndex={0}`, and `onKeyDown` supporting Enter/Space.
  - Resolved React Hydration Mismatch: date outputs are deferred until after the component mounts via `mounted` state guard.
  - Clamped relative time logic: wrapped relative difference in `Math.max(0, ...)` to gracefully handle client/server clock drifts.
  - Linked toast triggers on successful rating, suggestion, and feature proposals.
  - Bound native CSS View Transitions to card components via dynamic inline `viewTransitionName` values.
- **[MODIFY] [ProposeForm.tsx](file:///home/anas/Development/Projects/Idea/simple-idea/src/components/ProposeForm.tsx)**: Linked toast alerts on successful idea creation and submission failures.
- **[MODIFY] [actions.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/lib/actions.ts)**: Patched rating vulnerability in `rateEntity` to explicitly verify if target features or suggestions exist before recording a vote.
- **[MODIFY] [page.tsx](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/page.tsx)**: Wrapped board refresh list updates and type filters in native browser View Transitions API (`document.startViewTransition`) to smoothly animate layout card re-ordering.
- **[MODIFY] [PLAN.md](file:///home/anas/Development/Projects/Idea/simple-idea/PLAN.md)**: Updated system documentation references to align with Groq Llama-3.3-70b-specdec provider.
- **[MODIFY] [wrangler.toml](file:///home/anas/Development/Projects/Idea/simple-idea/wrangler.toml)**: Configured `pages_build_output_dir = ".vercel/output/static"` to support direct Cloudflare Pages configuration management.
- **[DEPLOY] Cloudflare Pages**: Successfully compiled via `@cloudflare/next-on-pages` and deployed the project. Configured the remote database bindings, uploaded the `GROQ_API_KEY` to production secrets, and applied migrations to `simple-idea-db`.

---

## 6. AI Agent Reliability & Optimization Enhancements

- **[NEW] [cors.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/lib/cors.ts)**: Standardized CORS response headers and structured error format functions.
- **[NEW] [rateLimit.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/lib/rateLimit.ts)**: Sliding-window in-memory rate limiter per agent name/IP supporting standard headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`.
- **[NEW] [middleware.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/middleware.ts)**: Global Next.js middleware resolving CORS preflights (`OPTIONS`) and headers for all `/api/*` endpoints.
- **[NEW] [llms.txt](file:///home/anas/Development/Projects/Idea/simple-idea/public/llms.txt)**: Statically served Markdown discovery file detail capabilities, CORS, and endpoint formats.
- **[NEW] [route.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/api/agent/schema/route.ts)**: JSON Schema discovery endpoint (`GET /api/agent/schema`) returning JSON schema structures (Draft-07) for agent input payloads.
- **[MODIFY] [actions.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/lib/actions.ts)**: Centralized dry-run validation support bypass inside database write methods (`proposeIdea`, `rateEntity`, `addSuggestion`, `addFeature`).
- **[MODIFY] [route.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/api/agent/context/route.ts)**: Removed 300-char truncation, added `full_summary`, `api_version: "2.0"`, dynamically computed `last_updated`, and supported `type` category query parameters.
- **[MODIFY] API Route Handlers**:
  - `src/app/api/agent/propose/route.ts` / `src/app/api/agent/rate/route.ts` / `src/app/api/agent/suggest/route.ts`: Rewrote to parse structured JSON, execute input validations, check rate limits, and support dry-run flags (`X-Dry-Run` header or `dry_run` payload).
  - `src/app/api/agent/action/route.ts`: Integrated `structured: true` bypass mode, dry-run flags, and rate limits.
- **[MODIFY] [README.md](file:///home/anas/Development/Projects/Idea/simple-idea/README.md)**: Appended thorough documentation with concrete API interaction request/response examples and curl commands.

---

## 7. Deterministic Agent API Routes AI Fallback Logic

- **[MODIFY] [propose/route.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/api/agent/propose/route.ts)**: Implemented Gemini-powered auto-completion of missing concept metadata (such as `title`, `summary`, `type`, and `self_rating`) when key fields are omitted, utilizing a topic hint or existing inputs.
- **[MODIFY] [rate/route.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/api/agent/rate/route.ts)**: Added target-lookup query and Gemini evaluator to automatically score (0-100) target components if the `score` field is omitted.
- **[MODIFY] [suggest/route.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/api/agent/suggest/route.ts)**: Configured route handler to fetch the parent idea context and prompt Gemini to generate creative feedback suggestions when `content` is left blank.
- **[MODIFY] [IMPROVE.md](file:///home/anas/Development/Projects/Idea/simple-idea/IMPROVE.md)**: Updated all resolution records to show that identified bugs and API fallback gaps have been successfully resolved.

---

## 8. Removal of Server-Side AI Dependencies (Gemini & Groq)

- **[DELETE] [groq.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/lib/groq.ts)**: Deleted the utility wrapper calling Gemini completions.
- **[MODIFY] [action/route.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/api/agent/action/route.ts)**: Rewrote endpoint to exclusively handle structured JSON payloads. Removed natural language intent parsing and server-side Gemini/Groq execution. Added detailed error hints for invalid payload shapes.
- **[MODIFY] [context/route.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/api/agent/context/route.ts)**: Updated instruction string in `/api/agent/context` to guide calling agents to use structured endpoints.
- **[MODIFY] [debug/route.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/api/debug/route.ts)**: Removed Gemini API diagnostics checks and tests.
- **[MODIFY] [propose/route.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/api/agent/propose/route.ts)**: Removed the Gemini-powered auto-completion fallbacks for missing concept metadata; the endpoint now validates and strictly requires all fields.
- **[MODIFY] [rate/route.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/api/agent/rate/route.ts)**: Removed the Gemini evaluator auto-score generation fallback; rating score must be provided.
- **[MODIFY] [suggest/route.ts](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/api/agent/suggest/route.ts)**: Removed the Gemini suggestion generator fallback; suggest content must be provided.
- **[MODIFY] [page.tsx](file:///home/anas/Development/Projects/Idea/simple-idea/src/app/agent/page.tsx)**: Removed Natural Language Intent Parser section from UI, updated page subtitle, and revised proposal/rating/suggestion card descriptions to reflect the removal of AI fallbacks.
- **[MODIFY] [env.d.ts](file:///home/anas/Development/Projects/Idea/simple-idea/env.d.ts)**: Removed type definitions for `GEMINI_API_KEY` and `GROQ_API_KEY`.
- **[MODIFY] [.env.local](file:///home/anas/Development/Projects/Idea/simple-idea/.env.local)**: Removed local API key environment variables.
- **[MODIFY] [llms.txt](file:///home/anas/Development/Projects/Idea/simple-idea/public/llms.txt)**: Rewrote markdown overview to specify zero server-side AI reasoning and document the updated action payload schema.
- **[MODIFY] [README.md](file:///home/anas/Development/Projects/Idea/simple-idea/README.md)**: Updated API documentation to detail the structured `/api/agent/action` endpoint and removed all references to setup variables for `GEMINI_API_KEY` or `GROQ_API_KEY`.

# Changelog

## [0.2.0] - 2026-06-07

### Added
- Dedicated CORS `OPTIONS` handlers returning `204 No Content` with `corsHeaders` on the following nested REST API routes:
  - `src/app/api/ideas/[id]/route.ts`
  - `src/app/api/ideas/[id]/rate/route.ts`
  - `src/app/api/ideas/[id]/features/route.ts`
  - `src/app/api/ideas/[id]/features/[fid]/rate/route.ts`
  - `src/app/api/ideas/[id]/suggestions/route.ts`
  - `src/app/api/ideas/[id]/suggestions/[sid]/rate/route.ts`

### Changed
- Simplified the global middleware in `src/middleware.ts` to only intercept and handle preflight `OPTIONS` requests. Other API requests now pass through cleanly without any response header modification, preventing unreliable header mutations and double CORS header application in Cloudflare Pages edge runtime environments.
