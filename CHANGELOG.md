# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-30

### Added
- **Interval Scheduling Engine**:
  - Declarative sequence configuration supporting an anchor time, interval step (minutes or hours), and occurrence count.
  - Fixed-interval formula calculation: `occurrence_time(n) = start_time + (n × interval)` with multi-day and midnight rollover handling.
  - Recurrence modes including One-Time Sequence, Daily Sequence, Selected Weekdays, and Continuous Repetition.
  - Isolated occurrence controls: snooze and skip actions advance or delay individual alerts without mutating the fixed master sequence cadence.
- **Native Android Hardware Integration**:
  - Hardware-level exact alarm scheduling using Android `AlarmManager` (`setExactAndAllowWhileIdle` and `setAlarmClock`).
  - Native `BroadcastReceiver` and foreground `AlarmPlaybackService` for offline, background, and locked-screen ringing without requiring an active WebView.
  - Device reboot recovery via `RECEIVE_BOOT_COMPLETED` and time/timezone change recovery via `ACTION_TIME_CHANGED` and `ACTION_TIMEZONE_CHANGED`.
  - Notification channel integration with direct dismiss/snooze actions and swipe-to-dismiss (`setDeleteIntent`) support.
  - Native ringtone playback routing through the system alarm audio stream with vibration and volume control.
- **User Interface & Design System**:
  - Circadian Luxury dark theme with Obsidian (`#121316`) canvas, Electric Lavender (`#c8bfff`) accents, and Cadence Emerald (`#40e17e`) operational verification markers.
  - Real-time calculated schedule preview tree displaying step indices, formatted times, relative offsets, and calendar day rollovers before saving.
  - Hero overview card with active countdown timer, horological dial visualization, and status indicator.
  - Tabular numeral formatting (`tabular-nums`) across all clock readouts, interval counters, and timeline trees to prevent layout jitter.
  - Full-screen ringing modal and sequence details inspection modal with progress ladders.
- **System Diagnostics & Reliability**:
  - System health diagnostic panel in Settings to verify Exact Alarm permission, Battery Optimization exemption, and Notification authorization.
  - Direct deep-links to native Android system settings for managing exact alarms and battery optimization.
- **Architecture & Tooling**:
  - Tauri 2 hybrid architecture connecting a Rust scheduling core with a React 19, TypeScript, and TailwindCSS frontend.
  - Bidirectional native bridge connecting Rust to Kotlin via Tauri plugins.
  - Comprehensive unit test suites covering interval formula calculations, schedule preview generation, downtime recovery, and native alarm intent cancellation.

## [1.0.0] - 2026-10-30

### Added
- **Interval Scheduling Engine**:
  - Declarative sequence configuration supporting an anchor time, interval step (minutes or hours), and occurrence count.
  - Fixed-interval formula calculation: `occurrence_time(n) = start_time + (n × interval)` with multi-day and midnight rollover handling.
  - Recurrence modes including One-Time Sequence, Daily Sequence, Selected Weekdays, and Continuous Repetition.
  - Isolated occurrence controls: snooze and skip actions advance or delay individual alerts without mutating the fixed master sequence cadence.
- **Native Android Hardware Integration**:
  - Hardware-level exact alarm scheduling using Android `AlarmManager` (`setExactAndAllowWhileIdle` and `setAlarmClock`).
  - Native `BroadcastReceiver` and foreground `AlarmPlaybackService` for offline, background, and locked-screen ringing without requiring an active WebView.
  - Device reboot recovery via `RECEIVE_BOOT_COMPLETED` and time/timezone change recovery via `ACTION_TIME_CHANGED` and `ACTION_TIMEZONE_CHANGED`.
  - Notification channel integration with direct dismiss/snooze actions and swipe-to-dismiss (`setDeleteIntent`) support.
  - Native ringtone playback routing through the system alarm audio stream with vibration and volume control.
- **User Interface & Design System**:
  - Circadian Luxury dark theme with Obsidian (`#121316`) canvas, Electric Lavender (`#c8bfff`) accents, and Cadence Emerald (`#40e17e`) operational verification markers.
  - Real-time calculated schedule preview tree displaying step indices, formatted times, relative offsets, and calendar day rollovers before saving.
  - Hero overview card with active countdown timer, horological dial visualization, and status indicator.
  - Tabular numeral formatting (`tabular-nums`) across all clock readouts, interval counters, and timeline trees to prevent layout jitter.
  - Full-screen ringing modal and sequence details inspection modal with progress ladders.
- **System Diagnostics & Reliability**:
  - System health diagnostic panel in Settings to verify Exact Alarm permission, Battery Optimization exemption, and Notification authorization.
  - Direct deep-links to native Android system settings for managing exact alarms and battery optimization.
- **Architecture & Tooling**:
  - Tauri 2 hybrid architecture connecting a Rust scheduling core with a React 19, TypeScript, and TailwindCSS frontend.
  - Bidirectional native bridge connecting Rust to Kotlin via Tauri plugins.
  - Comprehensive unit test suites covering interval formula calculations, schedule preview generation, downtime recovery, and native alarm intent cancellation.
