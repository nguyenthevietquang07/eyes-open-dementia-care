# Eyes Open - Dementia Care Assistant

## Overview
Eyes Open is a compassionate web application designed to help elderly people with dementia through two distinct modes: a caregiver mode for setup and an elder mode for hands-free, AI-powered visual recognition.

## Project Purpose
- **Caregiver Mode**: Create reminders and label objects/people with photos
- **Elder Mode**: Camera-based object recognition with gesture-controlled interactions (VR/AR ready)

## Current State
The MVP is complete with:
- Dual-mode interface (caregiver/elder)
- Reminder creation and management with date/time scheduling
- Object/people labeling with automatic object detection
- Real-time camera feed with AI-powered object recognition
- Thumbs up gesture detection to complete tasks
- Warning alerts for repeated object encounters
- Fully accessible, high-contrast design for elderly users

## Technical Architecture

### Frontend (React + TypeScript)
- **Framework**: React with Vite
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Components**: Shadcn UI + Tailwind CSS
- **AI/ML**: 
  - TensorFlow.js with COCO-SSD for generic object detection (person, bottle, etc.)
  - MobileNet for visual feature extraction and similarity matching
  - Visual similarity threshold: 65% for person/object identification
- **Animations**: Framer Motion

### Backend (Express + Node.js)
- **Server**: Express.js
- **Storage**: In-memory storage (MemStorage)
- **API Endpoints**:
  - `/api/reminders` - CRUD for reminders
  - `/api/labels` - CRUD for labels

### Data Model
- **Reminders**: title, description, scheduledFor, completed
- **Labels**: name, imageData, category (person/object), detectedObjects, lastSeenAt

## Key Features

### Caregiver Mode
- Clean dashboard with tabs for reminders and labels
- Reminder form with date/time picker
- Label creation with photo upload
- Automatic object detection when photos are uploaded
- Visual feedback showing detected objects with badges

### Elder Mode
- Full-screen camera view with back button navigation
- Real-time object detection overlay with live detection panel
- **Visual Recognition**: Uses MobileNet AI to identify SPECIFIC people and objects (e.g., "John" vs any person)
- Visual similarity matching (65% threshold) ensures labels only appear for the correct person/object
- Large, high-contrast label display when recognized objects appear
- Automatic reminder notifications at scheduled times
- Warning alerts when approaching recently seen objects
- Ultra-large text (text-6xl to text-8xl) for maximum visibility

## Design Philosophy
- **Accessibility First**: High contrast ratios, large text, simple interactions
- **Cognitive Load Minimization**: Elder mode has zero buttons, voice/gesture only
- **VR/AR Ready**: All elder mode UI uses absolute positioning for future 3D adaptation
- **Calming Aesthetics**: Teal primary color scheme (200 70% 45%) for trust and care

## Recent Changes
- **Visual Recognition System** (2025-01-11): Implemented MobileNet-based visual similarity matching to identify SPECIFIC people and objects, not just generic categories
  - 224x224 image preprocessing with aspect ratio preservation (letterboxing)
  - L2-normalized feature vectors for consistent embeddings  
  - 65% cosine similarity threshold for matching
  - Label feature caching to reduce redundant inference
  - 500ms throttling to prevent UI blocking
- **UI/UX Improvements** (2025-01-11): Added live detection panel, back button navigation, detected object badges in labels
- **App Renamed** (2025-01-11): Changed from Mind Minder to Eyes Open
- Implemented complete schema with reminders and labels (2025-01-10)
- Built all frontend components for both modes (2025-01-10)
- Integrated TensorFlow.js COCO-SSD for object detection (2025-01-10)
- Removed gesture detection to focus on core visual recognition (2025-01-11)

## User Preferences
- Prefer open-source, free AI/ML models
- Simple, accessible interface for elderly users
- No buttons in elder mode (gesture/voice control)
- Temporary storage acceptable for MVP
- Future VR/AR compatibility desired

## Development Notes
- All elder mode overlays use absolute positioning for VR/AR adaptation
- Camera permissions required for elder mode
- Object detection runs at ~30fps using requestAnimationFrame
- Gesture detection optimized for single hand (thumbs up)
- Repeated object warnings trigger if same object seen within 30 seconds
