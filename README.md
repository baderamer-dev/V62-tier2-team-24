# V62 Tier 2 Team 24

Chingu Voyage 62 project: an AI-powered learning-path web app built with Next.js (App Router), TypeScript, Tailwind CSS, and Firebase.

Users describe a career goal and their current skill level, and the app uses Google Gemini to generate a personalized step-by-step learning roadmap with curated resources for each step. Paths are saved to Firestore and progress is tracked per step.

## Features

- **Account signup and login** — custom JWT-based auth backed by Firestore; passwords hashed with bcrypt
- **AI-generated learning paths** — Gemini 2.5 Flash produces a structured 5–10 step roadmap tailored to the user's goal, skill level, and weekly availability
- **Resource recommendations** — each step includes 2–4 curated free or paid resources (courses, articles, videos, documentation) with type and free/paid labels
- **Step regeneration** — logged-in users can regenerate any individual step without rebuilding the whole path; the AI avoids duplicating topics already covered by neighbouring steps
- **Step completion tracking** — toggle individual steps complete/incomplete; progress is persisted to Firestore for logged-in users
- **Dashboard** — overview of all saved paths with progress bars and metadata
- **Guest mode** — unauthenticated users can still generate and view a path stored in browser session/local storage

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, lucide-react |
| Forms / validation | react-hook-form, Zod |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Auth | Custom JWT (`jose`), bcrypt (`bcryptjs`) |
| Database | Firestore via Firebase Admin SDK (server-side) |
| Firebase client | Firebase JS SDK v12 |
| Package manager | npm |
| CI | GitHub Actions (`npm test` on PRs and pushes to `main`) |
| Deployment | Netlify (via `@netlify/plugin-nextjs`) |

## Prerequisites

- Node.js 20 or later
- npm (comes with Node)
- A Firebase project with Firestore enabled
- A Google Gemini API key

## Getting started

```bash
git clone https://github.com/chingu-voyages/V62-tier2-team-24.git
cd V62-tier2-team-24
npm install
```

Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Do not commit `.env.local`. It is gitignored.

### Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase Admin project ID (server-side) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase Admin service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin private key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `JWT_SECRET` | Secret for signing JWTs — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |

See `.env.example` for the full list. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser; all others stay server-side only.

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If port 3000 is already in use, Next.js will pick another port — check the terminal output.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build (run `build` first) |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest |

## App routes

| Route | File | Notes |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Landing page |
| `/login` | `src/app/(auth)/login/page.tsx` | |
| `/signup` | `src/app/(auth)/signup/page.tsx` | |
| `/dashboard` | `src/app/dashboard/page.tsx` | Lists all saved paths for logged-in users |
| `/paths/new` | `src/app/paths/new/page.tsx` | Path generation form |
| `/paths/[id]` | `src/app/paths/[id]/page.tsx` | Path detail, step tracking, step regeneration |

## API routes

All routes that require authentication validate a `Bearer` JWT in the `Authorization` header via the `requireAuth` middleware (`src/lib/require-auth.ts`).

### Auth

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | No | Creates a new user account, returns a signed JWT |
| `POST` | `/api/auth/login` | No | Verifies credentials, returns a signed JWT |
| `GET` | `/api/auth/me` | Yes | Returns the authenticated user's profile from the JWT |

### Paths

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/generate-path` | No | Calls Gemini to generate a new learning path; does not persist |
| `POST` | `/api/paths` | Yes | Saves a generated path to Firestore under the authenticated user |
| `GET` | `/api/paths` | Yes | Returns all paths for the authenticated user, newest first |
| `GET` | `/api/paths/[id]` | Yes | Returns a single path (owner only) |

### Steps

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `PATCH` | `/api/paths/[id]/steps/[stepNumber]` | Yes | Toggles a step's `completed` state and returns updated progress |
| `PUT` | `/api/paths/[id]/steps/[stepNumber]` | Yes | Regenerates a single step via Gemini and persists the result |

## Data model

### `LearningPath`

```ts
{
  id: string;                        // "path_<uuid>"
  goal: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  totalSteps: number;
  steps: LearningPathStep[];
  createdAt: string;                 // ISO 8601
  userId?: string;                   // set server-side on save
  completedSteps: Record<number, boolean>;
}
```

### `LearningPathStep`

```ts
{
  stepNumber: number;
  title: string;
  description: string;
  estimatedWeeks: number;
  resources: Resource[];
}
```

### `Resource`

```ts
{
  title: string;
  url: string;
  type: "course" | "article" | "video" | "documentation" | "book" | "other";
  free: boolean;
  description: string;              // one sentence explaining why this resource is useful
}
```

## Project structure

```
src/
  app/
    (auth)/           # /login and /signup pages
    api/              # API route handlers
      auth/           # signup, login, me
      generate-path/  # AI path generation (unauthenticated)
      paths/          # CRUD for saved paths + step toggle/regenerate
    dashboard/        # Dashboard page
    paths/            # /paths/new and /paths/[id] pages
  components/         # Shared UI — Navbar, Footer, theme toggle, shadcn/ui
  features/
    auth/             # Auth form logic, token helpers, client API
    paths/            # Path form schema, client API helpers
  hooks/              # useAuth hook
  lib/
    ai-service.ts     # Gemini integration — generateLearningPath, regenerateStep
    auth.ts           # hashPassword, comparePassword, signToken, verifyToken
    firebase-admin.ts # Singleton Firebase Admin / Firestore instance
    firebase.ts       # Firebase client SDK initialisation
    require-auth.ts   # Auth middleware for API routes
    user-id.ts        # Guest user ID helpers
    utils.ts          # cn() and other shared utilities
  types/              # Shared TypeScript types (LearningPath, Resource, etc.)
```

Tailwind v4 is configured in `src/app/globals.css` — there is no `tailwind.config.ts`. shadcn/ui is configured via `components.json`.

## Automated tests

GitHub Actions runs `npm test` on every pull request into `main` and every direct push to `main`. A failed test blocks the PR check.

To receive notifications when a run fails, open the repository **Watch** menu and select **All Activity**.

## Team documents

- [Team Project Ideas](./docs/team_project_ideas.md)
- [Team Decision Log](./docs/team_decision_log.md)

## Our Team

- Yangchen Dema (Scrum Master): [GitHub](https://github.com/dema66) / [LinkedIn](https://www.linkedin.com/in/yangchendema/)
- Abiola Tijani (Developer): [GitHub](https://github.com/polanty) / [LinkedIn](https://www.linkedin.com/in/abiola-tijani-polanty/)
- Bader Amer (Developer): [GitHub](https://github.com/baderamer-dev)
- Anatolii Lukianenko (Developer): [GitHub](https://github.com/lukasemperfi)
- Ayoub Ouachra (Developer): [GitHub](https://github.com/lobisloby)
- Hadeel ALTalli (Shadow Scrum Master): [GitHub](https://github.com/Hadeel-AL-Talli) / [LinkedIn](https://www.linkedin.com/in/hadeel-tali/)

## Live App

[https://v62-tier2-team-24.vercel.app/](https://v62-tier2-team-24.vercel.app/)
