# Demo Plan

Use this storyboard when recording a portfolio demo video. Keep it short enough that a recruiter can watch it without scrubbing.

## 75-100 Second Recording

1. Open Eyes Open and create a caregiver account.
2. Show the dashboard status cards: active reminders, saved labels, on-device recognition, and user-scoped persistence.
3. Create a reminder such as "Take morning medication."
4. Upload a reference label for a safe non-private object and show the detected-object badges.
5. Switch to Elder Mode and grant camera permission.
6. Show the live detection panel and recognition status telemetry.
7. Trigger an active reminder and use a thumbs-up gesture to mark it complete.
8. Return to the dashboard and show the reminder is no longer active.
9. End on the README or architecture diagram to reinforce the technical story.

## What To Emphasize

- Care records are tied to the signed-in caregiver.
- PostgreSQL is the production persistence path.
- Browser-side AI keeps camera frames local.
- Caregiver setup turns personal context into elder-facing camera overlays.
- Gesture completion reduces touch/click burden for the elder.
- The prototype is honest about current limits and has a clear evaluation path.

## Suggested Assets

- Use a neutral object such as a mug, pill bottle prop, notebook, or pen.
- Use a fresh test account with non-private data.
- Keep the camera view pointed away from private household information.
- Record with browser devtools closed unless you are highlighting tests or architecture.

## Avoid

- Claiming clinical validation.
- Claiming exact accuracy or latency without benchmark logs.
- Showing private or identifiable real people without consent.
- Calling the memory/local JSON fallback production storage.
