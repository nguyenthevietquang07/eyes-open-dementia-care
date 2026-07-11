# Eyes Open Portfolio Positioning

## Strong Resume Bullets

- Built a privacy-conscious dementia care assistant using React, TypeScript, Express, TensorFlow.js, MobileNet embeddings, COCO-SSD, and MediaPipe Hands.
- Implemented caregiver-authored reminders and visual labels, browser-side object recognition, hands-free reminder completion, local persistence, and high-contrast elder-facing camera overlays.
- Optimized the prototype for portfolio review by lazy-loading ML model packages, surfacing inference telemetry, and documenting privacy, accessibility, and production-readiness tradeoffs.

## Interview Framing

Eyes Open is strongest when framed as an assistive AI systems project, not a generic CRUD app. The technically interesting pieces are:

- On-device browser inference for privacy-sensitive camera use
- Visual embedding comparison for user-defined people/object labels
- Gesture-based task completion for low-friction elder interaction
- Full-stack care-plan workflow with persistence and typed schemas
- Accessibility decisions for dementia care: large type, contrast, minimal choices, and camera-first overlays

## Claims To Avoid Until Benchmarked

- Do not claim exact accuracy without a labeled validation set and evaluation script.
- Do not claim exact latency without device/browser benchmark logs.
- Do not list Snap AR, OpenCV, or MobileNetV2 for this repository unless those implementations are added.

## Future Upgrades

- Add a benchmark script that records model load time, detection latency, and visual match confidence on sample images.
- Add a caregiver review queue for false-positive/false-negative corrections.
- Add optional Postgres storage through the existing Drizzle schema.
- Add a guided demo dataset with sample labels and screenshots for reviewers without a webcam.
