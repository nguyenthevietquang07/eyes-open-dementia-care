# Architecture

Eyes Open is designed as a privacy-conscious assistive AI loop: caregivers author context, the browser performs recognition, and the elder-facing view presents only the minimum useful information.

```mermaid
flowchart LR
  caregiver["Caregiver dashboard"] --> reminders["Reminder setup"]
  caregiver --> labels["Reference labels and photos"]
  reminders --> api["Express API"]
  labels --> api
  api --> store["Local JSON demo store<br/>Drizzle schema ready for Postgres"]

  elder["Elder camera view"] --> camera["Browser camera stream"]
  camera --> detect["COCO-SSD object detection"]
  detect --> crops["Detected object crops"]
  labels --> embedLabels["MobileNet label embeddings"]
  crops --> embedLive["MobileNet live embeddings"]
  embedLabels --> match["Cosine similarity match"]
  embedLive --> match
  match --> overlays["Large high-contrast labels"]
  reminders --> reminderOverlay["Reminder overlay"]
  camera --> gesture["MediaPipe thumbs-up gesture"]
  gesture --> complete["Mark reminder complete"]
  overlays --> elder
  reminderOverlay --> elder
  complete --> api
```

## Runtime Boundaries

- Camera frames stay in the browser.
- TensorFlow.js and MediaPipe models are loaded only when recognition features need them.
- The server stores caregiver-authored reminders, labels, reference images, and last-seen timestamps.
- `.local/eyes-open-data.json` provides restart-safe local demos and is intentionally ignored by Git.

## Market-Ready Next Steps

- Replace local JSON persistence with Postgres through the existing Drizzle schema.
- Add caregiver accounts and permissions for real household use.
- Add an evaluation set for visual-label matching accuracy and gesture reliability.
- Add explicit consent/onboarding screens before camera activation.
- Add offline/PWA packaging for tablet-first caregiver and elder workflows.
