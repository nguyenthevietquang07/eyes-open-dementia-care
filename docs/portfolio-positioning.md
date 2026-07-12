# Eyes Open Portfolio Positioning

## Strong Resume Bullets

- Built a privacy-conscious dementia care assistant using React, TypeScript, Express, PostgreSQL, TensorFlow.js, MobileNet embeddings, COCO-SSD, and MediaPipe Hands.
- Implemented authenticated caregiver accounts, user-scoped reminders and visual labels, browser-side object recognition, hands-free reminder completion, and high-contrast elder-facing camera overlays.
- Added API regression tests for auth, reminder completion/deletion, large label image uploads, and cross-user data isolation.
- Optimized the prototype for portfolio review by lazy-loading ML model packages, resizing label images client-side, surfacing inference telemetry, and documenting privacy, accessibility, and production-readiness tradeoffs.

## Interview Framing

Eyes Open is strongest when framed as an assistive AI systems project, not a generic CRUD app. The technically interesting pieces are:

- On-device browser inference for privacy-sensitive camera use
- Visual embedding comparison for user-defined people/object labels
- Gesture-based task completion for low-friction elder interaction
- Authenticated full-stack care-plan workflow with PostgreSQL persistence
- Accessibility decisions for dementia care: large type, contrast, minimal choices, and camera-first overlays
- Honest model-readiness boundaries backed by a clear evaluation plan

## Claims To Avoid Until Benchmarked

- Do not claim exact accuracy without a labeled validation set and evaluation script.
- Do not claim exact latency without device/browser benchmark logs.
- Do not list Snap AR, OpenCV, or MobileNetV2 for this repository unless those implementations are added.
- Do not describe this as a clinical or diagnostic product.

## Future Upgrades

- Add a benchmark script that records model load time, detection latency, and visual match confidence on sample images.
- Add a caregiver review queue for false-positive/false-negative corrections.
- Add household roles and invitation flows.
- Add a guided demo dataset with sample labels and screenshots for reviewers without a webcam.
