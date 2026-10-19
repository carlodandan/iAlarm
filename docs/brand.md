# Brand Documentation

This document establishes the brand identity, naming architecture, voice, tone, and visual guidelines for iAlarm (Interval Alarm).

---

## 1. Brand Identity & Naming Architecture

iAlarm utilizes a dual-tier naming framework designed to balance mobile operating system brevity with descriptive clarity.

```text
┌────────────────────────────────────────────────────────┐
│                        iAlarm                          │
│     (App Name: Launcher, Icon Label, System App Info)  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                    Interval Alarm                      │
│     (Full Name: Headers, Store Title, Documentation)   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               com.intervalalarm.alarm                  │
│       (Immutable Application Package Identifier)       │
└────────────────────────────────────────────────────────┘
```

### 1.1 App Name: iAlarm
- **Context**: Mobile app launcher icon label, system multitasking cards, Android App Info header, and window titles.
- **Form**: Always written with a lowercase `i` and an uppercase `A`: **iAlarm**.
- **Rationale**: Short, modern, easily recognizable in mobile app drawers, and fits within Android icon label character limits without truncation.

### 1.2 Full Name: Interval Alarm
- **Context**: Documentation headers, app store listings, website headings, and secondary eyebrow badges in the user interface.
- **Form**: Two words, standard title case: **Interval Alarm**.
- **Rationale**: Explicitly describes the core utility of the application — multi-occurrence interval scheduling.

### 1.3 Package Identifier: `com.intervalalarm.alarm`
- **Context**: Android application ID, AndroidManifest namespace, Tauri bundle identifier, and system settings package targets.
- **Form**: Lowercase dot-separated string: `com.intervalalarm.alarm`.
- **Constraint**: Must remain constant across all releases to ensure user data continuity and package integrity.

---

## 2. Brand Positioning & Philosophy

Most clock and alarm applications are designed as reactive emergency interrupters. They rely on aggressive crimson tones, screeching waveforms, and chaotic lists of disconnected alarms.

**iAlarm is positioned as a precision circadian instrument:**
- **Calm Authority**: The interface respects the user's attention and nervous system, particularly during sensitive awakening periods.
- **Predictable Cadence**: We emphasize structured rhythms over erratic alerts.
- **Mechanical Precision**: The brand conveys the reliability of horological clockwork combined with the certainty of native operating system scheduling.

---

## 3. Tone of Voice & Copywriting Standards

The iAlarm voice is concise, technical, dignified, and calm. We avoid alarmist language, exclamation points, and decorative marketing fluff.

### 3.1 Terminology Matrix

| Preferred Term | Discouraged Term | Reason |
|---|---|---|
| **Anchor Time** | Start Time / First Alarm | Conveys that all subsequent occurrences are mathematically tied to this starting point. |
| **Interval** | Gap / Delay / Frequency | Precise temporal duration between occurrences. |
| **Occurrence** | Alarm / Ring / Repeat | Emphasizes that each alert is part of a single coordinated sequence rather than an isolated alarm. |
| **Sequence Ladder** | Alarm List / Timetable | Emphasizes the progressive, stepped nature of the routine. |
| **Cadence** | Speed / Setting | Reflects rhythmic, recurring routines. |
| **Armed / Active** | On / Enabled | Reflects native operating system readiness. |
| **Dismiss Occurrence** | Stop Alarm | Clarifies that dismissing the current ring does not cancel the rest of the sequence. |

### 3.2 Writing Examples
- *Do*: "Next occurrence: 12:00 PM (+6h 00m). Android AlarmManager armed."
- *Don't*: "Your alarm will go off soon! Don't miss it!"
- *Do*: "Dismiss Occurrence (Advances sequence to 2 of 4)."
- *Don't*: "Turn off alarm."

---

## 4. Visual Identity Principles

### 4.1 Palette Hierarchy
- **Obsidian (#121316)**: The grounding canvas. Represents night, calm, and resting state.
- **Electric Lavender (#c8bfff)**: The primary brand color. Represents clarity, focus, and awakening without anxiety.
- **Cadence Emerald (#40e17e)**: The operational verification color. Signals that native subsystems are armed and occurrences have successfully executed.

### 4.2 Dark Mode Exclusivity
iAlarm does not support high-glare light themes by design. The interface is engineered exclusively for dark environments to safeguard circadian health and melatonin production during night-time interactions.

### 4.3 Typography Rules
- The logotype and titles use clean, modern geometric sans-serif typefaces (Inter).
- Clock readouts and interval metrics must always use tabular figures to maintain horizontal balance.
