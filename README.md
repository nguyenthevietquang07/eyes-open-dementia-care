# Eyes Open Dementia Care Assistant

Eyes Open is a full-stack prototype that helps caregivers create reminders and visual labels, then gives elders a simplified camera-first view for recognizing people, objects, and scheduled tasks.

## Highlights

- Caregiver dashboard for reminders and labeled people/objects
- Elder mode with large, high-contrast camera overlays
- TensorFlow.js object detection with COCO-SSD
- MobileNet-based visual matching for saved labels
- Gesture detection for hands-free task completion
- Express API with shared Zod/Drizzle schemas

## Tech Stack

- Frontend: React, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui
- AI/ML: TensorFlow.js, COCO-SSD, MobileNet, MediaPipe hands
- Backend: Express, Node.js, TypeScript
- Data layer: in-memory storage for the current prototype; Drizzle schema and `db:push` script are included for Postgres-backed evolution

## Project Structure

```text
eyes-open-dementia-care/
  client/        React frontend
  server/        Express API and Vite server integration
  shared/        Shared database schema and validation types
  scripts/       Utility scripts
```

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

The app defaults to `http://localhost:5000`.

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

## Notes for Reviewers

- Camera and ML features need browser camera permission.
- The current API stores data in memory, so local data resets when the server restarts.
- `design_guidelines.md` and `replit.md` document the product and accessibility decisions behind the prototype.
