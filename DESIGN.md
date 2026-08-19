---
name: Mediyaz ART Bank
description: High-trust reproductive healthcare, cryopreservation, and specialist fertility platform
colors:
  primary: "oklch(0.205 0 0)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.97 0 0)"
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  border: "oklch(0.922 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.2
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
  lg: "10px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
---

# Design System: Mediyaz ART Bank

## Overview

**Creative North Star: "The Clinical Sanctuary"**

Mediyaz presents a visual environment defined by clean, premium, and serene aesthetics. As a high-trust reproductive medical platform, it rejects flashy decorations and complex elements to prioritize patient accessibility, data clarity, and high-trust clinical precision. Spacing is comfortable, layouts are uncluttered, and interactions are designed to feel calm and deliberate.

**Key Characteristics:**
- High-trust clinical minimalism
- Serene whitespace and comfortable readability
- Muted color relationships with strict attention to data and privacy layout boundaries
- Consistent Indian Rupee (₹) currency alignment

## Colors

The palette leverages pure clinical whites, deep slate-charcoals, and clean neutral grays.

### Primary
- **Surgical Obsidian** (oklch(0.205 0 0)): Used for core layout components, primary headings, and bold call-to-action buttons.

### Secondary
- **Sanitized Pearl Gray** (oklch(0.97 0 0)): Used for background fills, page sections, and secondary content blocks.

### Neutral
- **Pristine Clinician White** (oklch(1 0 0)): Core background color for cards, panels, and forms.
- **Charcoal Slate** (oklch(0.145 0 0)): Text foreground and primary layout borders.

**The Absolute Focus Rule.** Accent colors (like destructive red or clinical teal) must be used on ≤10% of any given screen. Rarity emphasizes critical actions and fields.

## Typography

**Display Font:** Inter, sans-serif
**Body Font:** Inter, sans-serif

### Hierarchy
- **Display** (800, 3rem (48px), 1.2): Used for hero banners, landing headers, and main welcome titles.
- **Headline** (700, 1.875rem (30px), 1.3): Section headers and primary statistics cards.
- **Title** (600, 1.25rem (20px), 1.4): Dialog titles, card titles, and menu headings.
- **Body** (400, 0.875rem (14px), 1.5): Standard paragraphs, tooltips, and form captions. Max line length is restricted to 65–75ch for optimal reading comfort.
- **Label** (500, 0.75rem (12px), 1.2): Small uppercase captions, table headers, and status badges.

## Layout

Mediyaz utilizes a clean layout model with standard containers (max-w-5xl/max-w-7xl) centered on the canvas. Breakdown rules scale down spacing from desktop (spacing.lg) to mobile views (spacing.sm) to maintain clean padding across viewport heights.

## Elevation & Depth

Mediyaz is **Flat-by-Default** with subtle ambient depth. Surfaces utilize clean borders rather than shadows. 

**The Ambient Elevation Rule.** Shadows are omitted at rest. Soft ambient shadows (0 4px 24px rgba(0,0,0,0.05)) appear only as interactive responses to focus or hover states on cards, dialog overlays, and dropdown panels.

## Shapes

The form language is geometric and highly disciplined.

**The Consistent Corner Rule.** Primary cards, input blocks, buttons, and alert bars utilize a consistent corner radius of 10px (rounded.lg). Subtle child components utilize 8px (rounded.md) or 4px (rounded.sm).

## Components

### Buttons
- **Shape:** Gently rounded corners (10px radius)
- **Primary:** Charcoal Obsidian fill, off-white text, padded comfortably (12px 24px)
- **Hover:** Smooth background transitions to dark slate (0.2s duration)

### Cards / Containers
- **Corner Style:** Consistent 10px rounded corners
- **Background:** Pristine White fills (`--card`)
- **Border:** Muted gray stroke (`--border` / 1px)
- **Internal Padding:** Generous spacing (`spacing.lg` on desktop, `spacing.md` on mobile)

### Inputs / Fields
- **Style:** Light gray border, off-white focus glow
- **Focus:** Border transitions to blue-500 or teal-500 with smooth transitions
- **Error:** Destructive red border (`--destructive`) with standard label alignment

## Do's and Don'ts

### Do:
- **Do** wrap service catalog grids in direct slug links to specific details pages.
- **Do** format all price strings using the Indian Rupee symbol (₹).
- **Do** align the tracking status layout to match actual ConsultationRequest and DonorRegistration database schemas.

### Don't:
- **Don't** use any AI icons (`Sparkles`) anywhere on the site.
- **Don't** add duplicate CTAs or action buttons in the navigation header or page footers.
- **Don't** render financial donation indicators or charts on the administrative dashboard panels.
