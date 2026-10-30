# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-10-31

### Added
- **12 Bundled Custom Ringtones**: Packaged high-fidelity audio tracks into both native Android raw resources (`res/raw/`) and web assets:
  - *Best Android* (`best_android_rington`)
  - *Dandadan* (`dandadan_01`)
  - *Detective Conan* (`detective_conan_01`)
  - *Gintama* (`gintama_01`)
  - *Jujutsu Kaisen* (`jujutsu_kaisen_01`)
  - *Mi Remix MIUI 12* (`mi_remix_miui12`)
  - *Nokia Android* (`nokia_android`)
  - *One Piece 1, 2, 3* (`one_piece_01`, `one_piece_02`, `one_piece_03`)
  - *Oppo Calm* (`oppo_calm`)
  - *Samsung Galaxy S11* (`samsung_galaxy_s11`)
- **Native Ringtone Audition Bridge**: Added `test_tone` and `stop_tone` Tauri IPC commands connecting Rust, Kotlin's `AlarmPlugin`, and `RingtonePlayer` with haptic motor vibration preview and automatic completion cleanup.
- **Session-Based Audio Ownership**: Implemented audio session tokens (`currentPreviewId` and `isAudioOwner`) in `alarmApi` to guarantee that sound preview timeouts and modal dismissals cannot silence active foreground alarms.
- **Branch-Aware Release Automation**: Configured `.github/workflows/release.yml` with dynamic tagging, pre-release tagging, APK artifact naming, and script-injection prevention via environment variables.
- **Repository Showcase & License**: Added visual app showcase screenshots in `images/`, technology badges, and official MIT `LICENSE` documentation.

### Changed
- **Default Alarm Sound**: Switched the global default ringtone across Rust models, Android native storage, and frontend presets to *Best Android* (`best_android_rington`), completely removing the redundant device default option.
- **Ringtone Picker Organization**: Restructured ringtone selection into distinct *Custom Ringtones* and *Ambient Presets* groups in both `CreateAlarmModal` and `SettingsView`.
- **Tauri Toolchain Update**: Updated `@tauri-apps/api` and `@tauri-apps/cli` to `2.12.4` and suppressed AGP Java compile deprecation warnings.

### Fixed
- **Time Picker Digit Layout & Alignment**: Fixed irregular digit spacing (e.g. `6   : 00`) in `CreateAlarmModal` by setting hours to `text-right`, minutes to `text-left`, adding optical centering on the colon separator (`:`), removing browser spin-steppers, and adding explicit accessibility labels.
- **Alarm Silencing by Preview Timers**: Prevented 3.5s preview timeouts and unmount cleanups in `CreateAlarmModal` and `SettingsView` from calling global stop and silencing active alarms in `AlarmRingingModal`.
- **Android Legacy Preset Routing**: Allowed ambient synthesizer presets (*Aura Dawn*, *Zen Bell*, *Celestial Chime*, *Digital Pulse*, *Horizon Flare*) to play via the Web Audio synthesizer on Android instead of triggering a native fallback to generic device alarm ringtones.
- **WebView Autoplay Rejection Fallback**: Added a guarded fallback to native `test_tone` if WebView audio playback is rejected by Android autoplay policies.
- **Lock-Screen Single-Top Activity Handling**: Implemented `onNewIntent` in `AlarmRingingActivity` so consecutive alarm occurrences update the active screen smoothly without activity stack corruption.

---

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
