# Eyes Open Dementia Care Assistant

Eyes Open is a privacy-conscious assistive AI prototype for dementia care. Caregivers create reminders and visual labels for people or objects, then the elder-facing mode uses a camera-first interface to recognize surroundings, surface reminders, and complete tasks with a thumbs-up gesture.

![Eyes Open caregiver dashboard](docs/demo/homepage.png)

## Why It Stands Out

- Browser-side AI pipeline using TensorFlow.js COCO-SSD for object detection and MobileNet embeddings for visual label matching
- Elder Mode designed for low cognitive load: full-screen camera, high-contrast overlays, large text, and gesture-based task completion
- Caregiver dashboard with care-plan readiness metrics, saved recognition labels, reminders, and privacy status
- MediaPipe Hands integration for hands-free reminder completion
- Local JSON persistence for demo reliability, plus Drizzle schemas for a Postgres-backed production path
- ML model code is lazy-loaded so the dashboard renders before camera/model assets are needed

## Tech Stack

- Frontend: React, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui
- AI/ML: TensorFlow.js, COCO-SSD, MobileNet embeddings, MediaPipe Hands
- Backend: Express, Node.js, TypeScript
- Data: local JSON persistence in `.local/eyes-open-data.json`; Drizzle schema included for Postgres evolution

## Core Workflow

1. A caregiver creates reminders for scheduled tasks such as medication, hydration, or appointments.
2. A caregiver uploads reference photos and labels important people or objects.
3. The browser detects generic objects, extracts MobileNet visual embeddings, and compares camera crops against saved reference labels.
4. Elder Mode displays large visual labels and active reminders over the live camera view.
5. A thumbs-up gesture marks the active reminder complete without requiring touch input.

## Repository Structure

```text
eyes-open-dementia-care/
  client/        React frontend and browser AI hooks
  server/        Express API, Vite integration, and local persistent storage
  shared/        Drizzle/Zod schemas shared by client and server
  docs/demo/     Portfolio screenshot assets
  scripts/       Utility scripts
```

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

The app defaults to `http://localhost:5000`.

On Windows PowerShell, run scripts through `npm.cmd` if script execution policy blocks `npm`:

```powershell
npm.cmd run dev
```

## Scripts

- `npm run dev` - start the development server
- `npm run build` - build the client and server bundle
- `npm start` - run the production build
- `npm run check` - run TypeScript checks
- `npm run db:push` - push the Drizzle schema when `DATABASE_URL` is configured

## API Overview

- `GET /api/reminders`
- `POST /api/reminders`
- `PATCH /api/reminders/:id`
- `DELETE /api/reminders/:id`
- `GET /api/labels`
- `POST /api/labels`
- `PATCH /api/labels/:id`
- `DELETE /api/labels/:id`

## Quality Checks

```bash
npm run check
npm run build
```

The production build intentionally keeps TensorFlow/MediaPipe model code out of the initial dashboard path through dynamic imports. Vite may still warn about large ML chunks because browser-side vision models are substantial.

## Resume Positioning

Use wording that matches this repository:

- Built a privacy-conscious dementia care assistant with React, TypeScript, Express, TensorFlow.js, MobileNet embeddings, COCO-SSD, and MediaPipe Hands.
- Implemented caregiver-authored visual labels, browser-side object recognition, hands-free reminder completion, local persistence, and high-contrast elder-facing camera overlays.

Avoid claiming Snap AR, OpenCV, MobileNetV2, exact accuracy, or exact latency for this repo unless you add the matching implementation and benchmark artifacts.

## Notes for Reviewers

- Camera and ML features require browser camera permission.
- Camera frames are processed in the browser; the server stores only caregiver-created reminders, labels, and reference images.
- `.local/eyes-open-data.json` is ignored by Git because it contains local demo data.
- This is an assistive prototype, not a clinical diagnostic product.
