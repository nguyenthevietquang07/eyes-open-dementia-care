# Eyes Open Dementia Care Assistant

Eyes Open is a privacy-conscious assistive AI prototype for dementia care. Caregivers sign in, create reminders, and save visual labels for important people or objects; the elder-facing mode uses a camera-first interface to recognize surroundings, surface reminders, and complete tasks with a thumbs-up gesture.

![Eyes Open caregiver dashboard](docs/demo/homepage.png)

## Why It Stands Out

- User-scoped caregiver accounts with signed HTTP-only cookie sessions
- PostgreSQL persistence for reminders, labels, reference images, and last-seen timestamps when `DATABASE_URL` is configured
- Browser-side AI pipeline using TensorFlow.js COCO-SSD for object detection and MobileNet embeddings for visual label matching
- MediaPipe Hands integration for hands-free reminder completion in Elder Mode
- Caregiver dashboard with care-plan readiness metrics, recognition labels, reminders, and privacy status
- Large label images are resized in the browser and accepted by the API with a tested 10 MB payload limit
- ML model code is lazy-loaded so the dashboard renders before camera/model assets are needed

## Tech Stack

- Frontend: React, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui
- AI/ML: TensorFlow.js, COCO-SSD, MobileNet embeddings, MediaPipe Hands
- Backend: Express, Node.js, TypeScript, signed session cookies
- Data: PostgreSQL via `pg`; memory/local JSON fallback is limited to development and tests
- Quality: TypeScript checks plus Node API tests for auth, reminder CRUD, label upload payloads, and user isolation

## Core Workflow

1. A caregiver creates an account or signs in.
2. The caregiver creates reminders for scheduled tasks such as medication, hydration, or appointments.
3. The caregiver uploads reference photos and labels important people or objects.
4. The browser detects generic objects, extracts MobileNet visual embeddings, and compares camera crops against saved reference labels.
5. Elder Mode displays large visual labels and active reminders over the live camera view.
6. A thumbs-up gesture marks the active reminder complete without requiring touch input.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full flowchart and runtime boundaries.

```mermaid
flowchart LR
  caregiver["Caregiver signs in"] --> api["Express API"]
  api --> auth["Signed HTTP-only session"]
  api --> postgres["PostgreSQL persistence"]
  caregiver --> labels["Reference photos"]
  camera["Elder camera view"] --> detect["COCO-SSD detection"]
  detect --> match["MobileNet embedding match"]
  labels --> match
  match --> overlay["High-contrast elder overlay"]
  camera --> gesture["MediaPipe thumbs-up"]
  gesture --> api
```

## Repository Structure

```text
eyes-open-dementia-care/
  client/        React frontend and browser AI hooks
  server/        Express API, auth, storage adapters, Vite integration
  shared/        Drizzle/Zod table and validation schemas shared by client and server
  docs/          Architecture, demo plan, design notes, and screenshot assets
```

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

The app defaults to `http://localhost:5000`.

For real persistence, set `DATABASE_URL` in `.env`:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/eyes_open
SESSION_SECRET=replace-with-a-long-random-string
```

If `DATABASE_URL` is not set, the app falls back to local memory/JSON storage for development. Do not use that fallback for production or portfolio demos that need durable multi-user data.

When `DATABASE_URL` is set, the server ensures the required `users`, `reminders`, and `labels` tables exist on startup.

On Windows PowerShell, run scripts through `npm.cmd` if script execution policy blocks `npm`:

```powershell
npm.cmd run dev
```

## Scripts

- `npm run dev` - start the development server
- `npm run build` - build the client and server bundle
- `npm start` - run the production build
- `npm run check` - run TypeScript checks
- `npm test` - run API regression tests

## API Overview

Auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Protected caregiver data endpoints:

- `GET /api/reminders`
- `POST /api/reminders`
- `PATCH /api/reminders/:id`
- `DELETE /api/reminders/:id`
- `GET /api/labels`
- `POST /api/labels`
- `PATCH /api/labels/:id`
- `DELETE /api/labels/:id`

All reminder and label routes require an authenticated caregiver session and only return records owned by that user.

## Quality Checks

```bash
npm run check
npm test
npm run build
```

The production build intentionally keeps TensorFlow/MediaPipe model code out of the initial dashboard path through dynamic imports. Vite may still warn about large ML chunks because browser-side vision models are substantial.

## AI Model Readiness

The current AI stack is strong for a hackathon or portfolio prototype because camera frames stay in the browser and the models run without a cloud vision service. It is not yet a clinically or commercially validated recognition system. Before claiming exact accuracy or market readiness, add a labeled evaluation set for household objects/people, measure false positives and false negatives, and benchmark gesture completion across lighting, camera angles, and hand poses.

## Demo Assets

- Current screenshot: [docs/demo/homepage.png](docs/demo/homepage.png)
- Recording storyboard: [docs/demo-plan.md](docs/demo-plan.md)
- Architecture flowchart: [docs/architecture.md](docs/architecture.md)

A short video is worthwhile if it shows the full loop: account creation, caregiver setup, camera permission, live recognition, and thumbs-up completion. Do not use private or identifiable people in a public demo without consent.

## Resume Positioning

Use wording that matches this repository:

- Built a privacy-conscious dementia care assistant with React, TypeScript, Express, PostgreSQL, TensorFlow.js, MobileNet embeddings, COCO-SSD, and MediaPipe Hands.
- Implemented user-scoped caregiver accounts, visual labels, browser-side object recognition, hands-free reminder completion, persistent care records, and high-contrast elder-facing camera overlays.

Avoid claiming Snap AR, OpenCV, MobileNetV2, exact accuracy, or exact latency for this repo unless you add the matching implementation and benchmark artifacts.

## Notes for Reviewers

- Camera and ML features require browser camera permission.
- Camera frames are processed in the browser; the server stores caregiver-created reminders, labels, reference images, and last-seen metadata.
- `DATABASE_URL` enables PostgreSQL persistence. Local fallback data in `.local/eyes-open-data.json` is ignored by Git.
- This is an assistive prototype, not a clinical diagnostic product.
