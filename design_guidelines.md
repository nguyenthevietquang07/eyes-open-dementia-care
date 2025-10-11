# Design Guidelines: Dementia Care Assistant

## Design Approach

**Hybrid Approach**: Material Design (caregiver mode) + Custom AR-Style Overlay System (elder mode)

**Core Philosophy**: Maximum clarity and minimal cognitive load. Elder mode prioritizes instant recognition over aesthetics. Caregiver mode balances functionality with warm, approachable design.

**Key Principles**:
- Ultra-high contrast for all elder-facing elements
- Zero cognitive friction in elder mode
- Calm, trustworthy aesthetic for caregiver mode
- Accessibility-first throughout

---

## Mode-Specific Design

### Caregiver Mode Design
- **Visual Style**: Clean, organized interface with soft, reassuring colors
- **Interaction**: Traditional point-and-click with clear visual feedback
- **Layout**: Card-based organization for reminders and labels

### Elder Mode Design
- **Visual Style**: Minimal overlay on live camera feed with maximum contrast
- **Interaction**: Voice and gesture-only, no clickable elements
- **Layout**: Floating labels and notifications over camera view

---

## Color Palette

### Caregiver Mode
- **Primary**: 200 70% 45% (Calming teal - trust and care)
- **Background**: 210 20% 98% (Soft white)
- **Cards**: 0 0% 100% (Pure white)
- **Text Primary**: 220 15% 20% (Dark blue-gray)
- **Text Secondary**: 220 10% 50% (Medium gray)
- **Success**: 140 60% 45% (Gentle green)
- **Warning**: 25 90% 50% (Warm amber)

### Elder Mode
- **Overlay Background**: 0 0% 0% with 40% opacity (Semi-transparent black)
- **Label Text**: 0 0% 100% (Pure white)
- **Label Background**: 200 70% 40% with 90% opacity (Strong teal)
- **Alert/Warning**: 0 85% 55% with 95% opacity (Vibrant red)
- **Success**: 140 70% 50% with 95% opacity (Bright green)
- **Reminder Badge**: 280 65% 55% with 95% opacity (Purple)

---

## Typography

### Caregiver Mode
- **Primary Font**: Inter (via Google Fonts CDN)
- **Headings**: font-bold, text-2xl to text-3xl
- **Body**: font-normal, text-base
- **Labels**: font-medium, text-sm
- **Buttons**: font-semibold, text-base

### Elder Mode
- **All Text**: Extremely large and bold
- **Object Labels**: text-6xl to text-8xl, font-black (maximum weight)
- **Reminder Text**: text-5xl to text-7xl, font-bold
- **Warning Text**: text-6xl, font-black, tracking-wide
- **Use uppercase for critical information**

---

## Layout System

### Spacing Primitives
Use Tailwind units: **4, 6, 8, 12, 16, 24** for consistent rhythm
- **Caregiver mode**: p-6, gap-4, space-y-6 for comfortable spacing
- **Elder mode**: p-12 to p-16 for generous padding, ensuring touch-free zones

### Caregiver Mode Layout
- **Container**: max-w-6xl mx-auto
- **Two-column layout**: Sidebar (reminders list) + Main area (labels/camera setup)
- **Grid for labels**: grid-cols-2 lg:grid-cols-3 gap-6

### Elder Mode Layout
- **Full viewport**: Fixed camera feed background (w-screen h-screen)
- **Floating overlays**: Absolute positioned with generous margins
- **Label positioning**: Top-center for object labels
- **Reminder positioning**: Bottom-third for task reminders
- **Warning positioning**: Center-screen for alerts

---

## Component Library

### Caregiver Mode Components

**Navigation Header**
- Fixed top bar with mode toggle (prominent, large switch)
- App title on left, "Switch to Elder Mode" button on right
- Background: white with subtle shadow

**Reminder Cards**
- White background, rounded-2xl, p-6
- Time/date prominent at top (text-xl, font-bold)
- Task description (text-lg)
- Edit/delete icons (right-aligned, subtle gray)

**Label Cards**
- Square aspect ratio with image
- Name overlay on hover (caregiver) or always visible (elder preview)
- Rounded-xl, shadow-md
- Add new card with dashed border and plus icon

**Camera Preview**
- Rounded-xl container
- Live feed with overlay grid for label placement
- Capture button (large, primary color)

### Elder Mode Components

**Object Label Overlay**
- Pill-shaped container (rounded-full)
- Ultra-high contrast: white text on solid teal/custom color
- Pulsing animation when first detected
- Fixed position relative to detected object

**Reminder Notification**
- Large card at bottom-center
- Reminder icon + task text
- Countdown timer if applicable
- Auto-dismiss on thumbs-up gesture
- Gentle pulse animation to draw attention

**Warning Alert**
- Full-width banner across center
- Red background with white text
- Large warning icon (Heroicons: exclamation-triangle)
- "YOU'VE BEEN HERE RECENTLY" or similar message

**Gesture Feedback**
- Thumbs up detection: Green checkmark animation fills screen
- Processing indicator: Subtle spinner in corner (for CV model latency)

---

## Iconography
- **Library**: Heroicons (solid variant for elder mode, outline for caregiver)
- **Elder mode icons**: Extra large (w-24 h-24 minimum)
- **Caregiver mode icons**: Standard size (w-6 h-6)

---

## Accessibility Features

### Elder Mode Specific
- **Contrast ratio**: Minimum 7:1 for all text
- **Font sizes**: Never below 4rem (text-6xl)
- **Touch targets**: None (gesture/voice only)
- **Motion**: Reduced motion preference respected, keep animations minimal
- **Voice feedback**: All actions confirmed with audio cues

### Caregiver Mode
- **Contrast ratio**: Minimum 4.5:1
- **Touch targets**: Minimum 44x44px
- **Keyboard navigation**: Full support
- **Screen reader**: Proper ARIA labels

---

## Animations

**Caregiver Mode**: Minimal
- Smooth transitions (transition-all duration-200)
- Hover states on interactive elements
- Modal fade-in/out

**Elder Mode**: Purposeful only
- Pulsing for new labels/reminders (animate-pulse)
- Success confirmation (scale-in with fade)
- Warning flash (gentle, not jarring)

---

## Images

**Caregiver Mode**:
- User-uploaded photos for labels (people/objects)
- Camera feed preview in setup area
- Placeholder icons for empty states

**Elder Mode**:
- Live camera feed as full-screen background
- Overlay UI elements on top
- User-uploaded reference photos (not visible, used for CV matching)

**No decorative images needed** - functionality-focused design

---

## Special Considerations

### VR/AR Readiness
- All elder mode overlays use absolute positioning
- Depth hierarchy maintained through z-index
- No scrolling in elder mode
- Labels designed for 3D space adaptation

### Performance
- Lazy load caregiver mode images
- Optimize camera feed (reduced resolution if needed)
- Debounce CV model calls to prevent lag

### Privacy & Safety
- Clear visual indicator when camera is active
- Caregiver mode shows what elder sees
- Emergency contact button in both modes (voice-activated in elder mode)