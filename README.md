# V62 Tier 2 Team 24

Chingu Voyage 62 project: a learning-path web app built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Firebase.

Pages are currently boilerplate placeholders. The app structure and tooling are in place so the team can implement features.

## Features (planned)

- Account signup and login
- Dashboard of saved learning paths
- Create a new path (`/paths/new`)
- View a path by id (`/paths/[id]`)
- API route for path generation (`/api/generate-path`)

## Tech stack

- **Frontend / app:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui, lucide-react
- **Forms / validation:** react-hook-form, zod
- **Backend services:** Firebase (client + planned Admin SDK)
- **Package manager:** npm
- **CI:** GitHub Actions (`npm test` on pull requests and pushes to `main`)

## Prerequisites

- Node.js 20 or later
- npm (comes with Node)

## Getting started

```bash
git clone https://github.com/chingu-voyages/V62-tier2-team-24.git
cd V62-tier2-team-24
npm install
```

Copy the environment template and fill in Firebase values:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Do not commit `.env.local`. It is gitignored.

### Run the frontend (dev)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If port 3000 is already in use, Next.js will pick another port. Check the terminal for the URL.

### Other scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build (run `build` first) |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest (smoke test today) |

## App routes

| Route | File |
| --- | --- |
| `/` | `src/app/page.tsx` |
| `/login` | `src/app/(auth)/login/page.tsx` |
| `/signup` | `src/app/(auth)/signup/page.tsx` |
| `/dashboard` | `src/app/dashboard/page.tsx` |
| `/paths/new` | `src/app/paths/new/page.tsx` |
| `/paths/[id]` | `src/app/paths/[id]/page.tsx` |
| `POST /api/generate-path` | `src/app/api/generate-path/route.ts` |

## Project structure

```
src/
  app/                 # Next.js App Router pages and API routes
  components/          # Shared UI (Navbar, Footer, shadcn/ui)
  features/            # Feature modules (auth, paths)
  hooks/               # React hooks (useAuth)
  lib/                 # Firebase client, shared utils
  backend/             # Firebase Admin and AI service placeholders
  types/               # Shared TypeScript types
```

Tailwind v4 is configured in `src/app/globals.css` (no `tailwind.config.ts`). shadcn/ui lives in `components.json` and `src/components/ui`.

## Environment variables

See `.env.example` for the full list. Client keys use the `NEXT_PUBLIC_` prefix. Admin keys stay server-side only.

## Automated tests

GitHub Actions runs `npm test` for every pull request into `main` and every push to `main`. A failed test appears as a failed check on the commit and pull request.

To receive a GitHub notification when a run fails, each teammate should open the repository's **Watch** menu and select **All Activity**. Repository access by itself does not subscribe a teammate to every workflow failure.

## Team documents

- [Team Project Ideas](./docs/team_project_ideas.md)
- [Team Decision Log](./docs/team_decision_log.md)

Meeting agenda templates (in `/docs`):

- Meeting - Voyage Kickoff → `./docs/meeting-voyage_kickoff.docx`
- Meeting - App Vision & Feature Planning → `./docs/meeting-vision_and_feature_planning.docx`
- Meeting - Sprint Retrospective, Review, and Planning → `./docs/meeting-sprint_retrospective_review_and_planning.docx`
- Meeting - Sprint Open Topic Session → `./docs/meeting-sprint_open_topic_session.docx`

## Our Team

- Yangchen Dema (Scrum Master): [GitHub](https://github.com/dema66) / [LinkedIn](https://www.linkedin.com/in/yangchendema/)
- Abiola Tijani (Developer): [GitHub](https://github.com/polanty) / [LinkedIn](https://www.linkedin.com/in/abiola-tijani-polanty/)
- Bader Amer (Developer): [GitHub](https://github.com/baderamer-dev)
- Anatolii Lukianenko (Developer): [GitHub](https://github.com/lukasemperfi)
- Ayoub Ouachra (Developer): [GitHub](https://github.com/lobisloby)
- Hadeel ALTalli (Shadow Scrum Master): [GitHub](https://github.com/Hadeel-AL-Talli) / [LinkedIn](https://www.linkedin.com/in/hadeel-tali/)


## Website Link

[https://v62-tier2-team-24.vercel.app/](https://v62-tier2-team-24.vercel.app/)