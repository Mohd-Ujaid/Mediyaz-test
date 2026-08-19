# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Intended Parents / Recipient Couples**: Seeking trusted sperm/egg donor selection, surrogacy options, and booking consultations to address their fertility journey.
- **Altruistic Donors**: Individuals wishing to apply, undergo clinical screening (Aadhaar validation, medical surveys), and register their profiles in the bank.
- **Clinical Administrative Staff**: Managing the booking pipelines, reviewing donor registration files, moderating feedback, and exporting analytics logs.

## Product Purpose
To provide a secure, transparent, and legally compliant international ART (Assisted Reproductive Technology) donor registry and clinic. Success means high matching rates, secure genetic profiles, and clear step-by-step guidance for patients.

## Positioning
A highly verified, transparent international donor registry with absolute medical confidence, comprehensive genetic matching, cold-chain logistics, and real-time public submission tracking.

## Operating Context
- Clinical consulting desktop workflows.
- Mobile-first onboarding, multi-step application wizards, and print-ready medical profile checklists.
- Admin dashboard tracking bookings, donor screenings, reviews, and exporting spreadsheet data.

## Capabilities and Constraints
- **Capabilities**: Multi-stage donor registration, document/reports upload, real-time consultation tracking (CN-/MED- prefixes), customer review uploads with multiple media support, and administrative Excel exports.
- **Technical Constraints**: Built using Next.js 16 (Turbopack), MongoDB (Mongoose), vanilla CSS/Tailwind, and ImageKit.
- **Terminology**: Swapped all generic references from "Recipient Program" to "How it Works" layout structure; bookings are labeled as "Consultation Bookings".

## Brand Commitments
- Name: Mediyaz
- Theme: Medical-grade professional trust, clean user-centric layouts.
- Currency: Indian Rupee (₹) used exclusively across the website.
- Guidelines: Strictly no AI symbols (`Sparkles`) are permitted anywhere on the site.

## Evidence on Hand
- Seed script (`/api/seed`) populating IVF treatments, mock consultations, and active donor applications.
- Real-time client status tracker page (`/track`) matching live Mongoose collections.
- ImageKit integration for multi-media family success stories.

## Product Principles
1. **Medical Professionalism & Trust**: Information layout must present medical procedures, screenings, and logistics transparently.
2. **Clear & Compassionate UX**: The interface must simplify complex journeys into logical steps (e.g. "How it Works").
3. **Absolute Privacy & Compliances**: Clean data interfaces with strict patient and donor confidentiality boundaries.
