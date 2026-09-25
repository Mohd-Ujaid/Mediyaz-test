# Mediyaz Design System (Permanent Source of Truth)

This document is the permanent source of truth for the design system of the Mediyaz platform. All components, layouts, and pages must strictly conform to these rules and values.

---

## 🎨 Color Palette (Logo-Derived Light System)

The color palette is derived directly from the Mediyaz logo. It features light backgrounds with controlled, premium colorful accents.

### Core Mappings
- **Primary Teal** (`#2f4f57` / `oklch(0.28 0.05 200)`): Derived from the logo. Used for clinical headers, primary buttons, and visual anchors.
- **Secondary Amber Gold** (`#e7ae08` / `oklch(0.75 0.16 85)`): Derived from the logo. Used selectively for highlighting verification, approved states, and trust highlights.
- **Warm Ivory Background** (`#faf9f6` / `oklch(0.98 0.01 70)`): Warm neutral base background to make the platform feel human and credible.
- **Canvas White** (`#ffffff`): Used for card panels, input fields, and page blocks.
- **Teal Charcoal** (`#1a2b2f` / `oklch(0.18 0.02 200)`): Used for primary text copy and high-priority borders.
- **Muted Gray-Teal** (`#5a6e73`): Used for secondary subtitle copy.

### Supporting Light Accents
- **Soft Aqua** (`#f0f7f7`): For section highlights and hover targets.
- **Soft Sky** (`#f0f9ff`): Highlight fill for recipient pages.
- **Subtle Lavender** (`#faf5ff`): Highlight fill for donor pages.
- **Gentle Green** (`#f0fdf4`): Highlighting medical screen approvals.

*Rule*: Avoid dark sections, dark headers, or pure black text blocks. Maintain a high-trust, light sanctuary look.

---

## ✍️ Typography System

- **Sans-Serif Font (Body & UI)**: `Inter`, system-ui, sans-serif. Used for body text, lists, input labels, buttons, and navigation elements.
- **Editorial Serif Font (Headlines)**: `Georgia`, `Playfair Display`, serif. Used exclusively for large displaying display titles (e.g., hero headlines, main H2 section headlines) to convey biotechnology authority and premium care.
- **Hierarchy Scale**:
  - **Display Headline**: `text-4xl sm:text-5xl lg:text-6xl`, font-extrabold, serif, leading-tight.
  - **H2 Section Header**: `text-2xl sm:text-3xl lg:text-4xl`, font-bold, serif or sans, tracking-tight.
  - **H3 Subsection Header**: `text-lg sm:text-xl`, font-semibold, sans.
  - **Body Standard**: `text-sm sm:text-base`, line-height 1.6, max width 65-75ch.
  - **UI Label / Small**: `text-xs`, font-bold, tracking-wide.

---

## 📐 Spacing & Geometry

### 8px Spacing Grid
All paddings, margins, grid gaps, and absolute layouts must snap to clean 8px intervals:
- `8px` (`p-2` / `gap-2` / `m-2`)
- `16px` (`p-4` / `gap-4` / `m-4`)
- `24px` (`p-6` / `gap-6` / `m-6`)
- `32px` (`p-8` / `gap-8` / `m-8`)
- `48px` (`p-12` / `m-12`)
- `64px` (`p-16` / `m-16`)

### Controlled Corner Radii Scale
- **Small Component Radius (Inputs, Badges)**: `8px` (`rounded-lg`)
- **Action Elements (Buttons, Inner Cards)**: `10px` (`rounded-xl` or `rounded-[10px]`)
- **Containers & Inner Panels**: `12px` (`rounded-2xl` / `rounded-[12px]`)
- **Outer Containers & Main Pathways**: `16px` (`rounded-2xl` / `rounded-[16px]`)
- **Hero Blocks & Feature Panels**: `20px` maximum (`rounded-[20px]`)
- *Rule*: Never use generic capsule/pill shapes on major cards, buttons, or list containers.

---

## 🛡️ Component Standards

### 1. Buttons
- **Primary CTA**: Solid Primary Teal (`bg-primary`), white text. 10px radius, shadow-sm.
- **Secondary CTA**: Outline primary teal (`border-primary text-primary`), warm hover tint. 10px radius.
- **Donor CTA**: Solid Amber Gold or ghost option.
- **Touch Target**: Ensure a minimum touch height of `44px` on mobile screens.

### 2. Cards & Containers
- Clean 1px border stroke (`border border-border/80`).
- Subtle rest depth shadows: `box-shadow: 0 4px 16px -2px rgba(47, 79, 87, 0.04)`.
- No card-heavy clutter. Group related properties inside tabular grids or process stages.

### 3. Inputs & Forms
- Rounded 8px corners, height `40px` (or `44px` for touch targets).
- Thin borders with a smooth teal focus ring transition (`focus:ring-2 focus:ring-primary/20 focus:border-primary`).
