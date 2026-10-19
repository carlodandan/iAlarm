# Design Documentation

This document describes the design system, visual tokens, circadian color palette, typography, and component specifications for iAlarm (Interval Alarm), based on the Google Stitch design reference (`12645557834043799877`).

---

## 1. Design Philosophy

Traditional utility alarms are visually jarring, high-anxiety tools dominated by high-contrast reds and abrasive layout patterns.

**iAlarm adopts a Circadian Luxury aesthetic**:
- **Dark Obsidian Canvas**: Minimizes blue light exposure and ocular strain during night and early morning wakeups.
- **Electric Lavender Accent**: Provides an ethereal, calming visual focus that remains highly legible without triggering stress responses.
- **Horological Precision**: Incorporates dial motifs, geometric circular markers, and tabular digital clock readouts that emphasize temporal accuracy.
- **Tactile Feedback**: Subtle active-scale transformations (`active:scale-[0.98]`) and oversized toggle switches create a mechanical, physical tool feel.

---

## 2. Color System & Theme Tokens

The application operates in a pure dark theme designed for OLED/AMOLED power efficiency and circadian comfort.

### 2.1 Color Palette

| Token Name | Hex Value | Semantic Role |
|---|---|---|
| **Canvas Background** | `#121316` | Root screen background; deep obsidian surface. |
| **Surface Raised** | `#1b1b1f` | Primary card containers, headers, and section tiles. |
| **Surface Accent** | `#292a2d` | Stepper containers, segmented buttons, secondary controls. |
| **Surface Border** | `rgba(255, 255, 255, 0.05)` | Hairline dividers and subtle container outlines. |
| **Primary Accent** | `#c8bfff` | Electric lavender; brand identity, active toggles, countdown badges. |
| **Primary Muted** | `rgba(200, 191, 255, 0.15)` | Lavender tint for badges, icon rings, and glow effects. |
| **Success / Cadence** | `#40e17e` | Cadence emerald; occurrence completion, active system status. |
| **Alert / Dismiss** | `#ff5c5c` | Subdued coral red; destructive actions, dismiss badges. |
| **Text Primary** | `#e3e2e6` | High-contrast body text, headings, and primary readouts. |
| **Text Secondary** | `#c9c4d3` | Subtitles, labels, and secondary indicators. |
| **Text Muted** | `#928f9d` | Timestamp tags, inactive pills, and unit labels. |

---

## 3. Typography & Numerical Formatting

- **Font Family**: Inter, `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **Clock Readouts**: All digital clocks, timers, and occurrence counters utilize tabular numerals (`font-feature-settings: "tnum"`, Tailwind `tabular-nums`) to prevent horizontal jitter during second-by-second countdowns.
- **Eyebrow Badges**: 10px uppercase with generous tracking (`tracking-widest`, `font-semibold`) used above primary section headers.

### Type Scale

| Style | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| **Display** | 54px / 60px | Light (300) | 1.0 | Ringing screen clock display. |
| **Headline Large** | 24px / 28px | Bold (700) | 1.2 | Modal titles, sequence names. |
| **Headline Medium** | 18px / 20px | Semi-Bold (600) | 1.25 | Card titles, category headings. |
| **Body** | 14px / 16px | Normal (400) | 1.4 | Descriptions, preview item text. |
| **Label Small** | 11px / 12px | Semi-Bold (600) | 1.2 | Tags, stepper labels, badge text. |
| **Micro / Eyebrow** | 10px | Bold (700) | 1.0 | Section eyebrows, protocol markers. |

---

## 4. Layout Architecture & Spacing

### 4.1 Safe Area Constraints
Mobile viewports must accommodate system camera notches, dynamic islands, and home indicator gestures.
- Root containers utilize `pt-safe` and `pb-safe` padding utilities.
- HTML viewport declaration sets `viewport-fit=cover`.
- Bottom floating actions and navigation bars maintain a minimum clearance of 80px above the screen bottom.

### 4.2 Corner Radii
- **Hero & Cards**: `rounded-3xl` (24px) for prominent container surfaces.
- **Section Modules**: `rounded-2xl` (16px) for settings panels and preview trees.
- **Interactive Controls**: `rounded-xl` (12px) for steppers, chips, and input fields.
- **Pills & Toggles**: `rounded-full` (9999px) for status indicators and switches.

---

## 5. Key Component Specifications

### 5.1 Hero Next Alarm Card
The focal point of the home view provides immediate clarity regarding the upcoming occurrence:
- **Ambient Radial Gradient**: Subtle lavender glow (`#c8bfff/10`) positioned behind the clock readout with a 48px blur radius.
- **Next Occurrence Badge**: Pill indicator featuring a pulsating dot and a countdown string (e.g., `In 4h 12m`).
- **Tactile Toggle**: Oversized dual-state pill toggle with smooth 200ms background transition.

### 5.2 Live Preview Timeline Tree
The schedule creation modal displays a visual tree structure before commitment:
- Each node represents an occurrence with a circular connector line.
- Node elements include:
  - Numerical step badge (`#1`, `#2`, `#3`).
  - Formatted time string with AM/PM indicator.
  - Relative offset badge (e.g., `+6h 00m`).
  - Rollover calendar pill (`Today`, `Tomorrow`).

### 5.3 Horological Dial SVG Motif
The sequence details modal includes an animated circular SVG dial:
- Outer track: Dimmed border circle representing the 24-hour day cycle.
- Dynamic arc: Lavender stroke indicating progress through the interval duration.
- Center readout: Current active occurrence number and target trigger time.

### 5.4 Sequence Progress Ladder
Visual representation of occurrence statuses within an active sequence:
- **Done State**: Dimmed text, emerald checkmark badge.
- **Active State**: Lavender ring, highlighted timestamp, and adjacent **Skip Next** button.
- **Queued State**: Muted text, empty circle marker.

---

## 6. Accessibility & Usability Standards

- **Color Contrast**: Primary text on `#121316` and `#1b1b1f` exceeds a contrast ratio of 12:1 (exceeding WCAG AAA requirements). Secondary labels maintain at least 4.5:1.
- **Target Sizes**: All interactive buttons, chips, and toggles provide a minimum physical touch target of 44x44px.
- **No Reliance on Color Alone**: Alarm states combine color tokens with distinct geometric icons and explicit textual labels (e.g., `Active`, `Done`, `Skipped`).
