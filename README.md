# iAlarm (Interval Alarm)

An offline-first Android utility built with Tauri 2, React 19, TypeScript, TailwindCSS v4, Rust, and native Kotlin integration.

Interval Alarm enables users to create a single alarm sequence that automatically schedules multiple occurrences at fixed intervals from a chosen anchor time, without requiring multiple alarms to be configured manually.

- **Application Name:** iAlarm
- **Full Brand Name:** Interval Alarm
- **Package Identifier:** `com.intervalalarm.alarm`

---

## Key Features

- **Automated Fixed-Interval Scheduling**: Schedules occurrences based on the formula `occurrence(n) = start_time + (n * interval)`.
- **Multi-Day and Midnight Rollover**: Sequences seamlessly traverse midnight and span multiple calendar days.
- **Recurrence Modes**: Supports One-Time, Daily, Selected Weekdays, and Continuous sequence repetition.
- **Native Android AlarmManager Integration**: Alarms are registered as exact alarm clocks via Android's `setAlarmClock` API, showing the system alarm clock icon and waking the device from Doze mode.
- **Zero-WebView Background Dependency**: Active sequences are mirrored to Android `SharedPreferences`. If the application process is terminated or the phone reboots, alarms trigger and advance headlessly via native broadcast receivers.
- **Lock-Screen Full-Screen Intent Presentation**: Uses `SCREEN_BRIGHT_WAKE_LOCK`, `ACQUIRE_CAUSES_WAKEUP`, and `setShowWhenLocked` to illuminate the screen and present a dismiss/snooze interface over the keyguard.
- **Hardware Audio and Device Ringtone Detection**: Automatically detects the user's default device alarm ringtone and enforces audible volume on the `STREAM_ALARM` audio channel.
- **Isolated Snooze Architecture**: Snoozing creates a temporary occurrence without altering the master sequence interval grid.
- **Downtime and Past-Occurrence Handling**: Expired occurrences from system downtime or battery depletion are skipped cleanly, targeting the next valid future occurrence.
- **Circadian Luxury Interface**: Built with TailwindCSS v4 using a dark obsidian palette (`#121316`), electric lavender accents (`#c8bfff`), cadence emerald (`#40e17e`), and tabular digital clock readouts.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, TailwindCSS v4, Vite, Lucide Icons |
| **Desktop / Core Bridge** | Tauri 2 runtime, Rust, Chrono, UUID, atomic file persistence |
| **Android Native** | Kotlin, `AlarmManager`, `BroadcastReceiver`, `WakeLock`, `NotificationManager`, `AudioAttributes` |
| **Build & Toolchain** | Gradle 9.6.1, Android SDK (API 24 to 37), Android NDK 30, Rust Android target `aarch64-linux-android` |

---

## Project Structure

```text
iAlarm/
├── docs/                           # Comprehensive technical documentation
│   ├── system.md                   # System requirements, permissions, and lifecycle
│   ├── architecture.md             # Architecture diagrams, data flow, and components
│   ├── product.md                  # Product specifications, formulas, and use cases
│   ├── design.md                   # Stitch visual design system, colors, and layout
│   └── brand.md                    # Brand guidelines, naming conventions, and voice
├── src/                            # React frontend application
│   ├── components/                 # UI views (HomeOverview, CreateAlarmModal, etc.)
│   ├── services/                   # AlarmApi Tauri invoke and native plugin bridge
│   ├── types/                      # TypeScript domain models and interfaces
│   ├── App.tsx                     # Main application entry point and state coordination
│   └── App.css                     # Theme tokens and TailwindCSS v4 imports
├── src-tauri/                      # Rust backend engine
│   ├── src/
│   │   ├── android_bridge.rs       # JNI and mobile plugin communication wrapper
│   │   ├── commands.rs             # Tauri IPC command definitions
│   │   ├── models.rs               # Strongly typed sequence and settings structs
│   │   ├── scheduler.rs            # Deterministic interval calculation engine
│   │   ├── storage.rs              # Atomic file I/O and schema versioning
│   │   └── lib.rs                  # Application runtime and plugin registration
│   ├── capabilities/               # Tauri 2 security permissions
│   ├── tauri.conf.json             # Tauri configuration (iAlarm / com.intervalalarm.alarm)
│   └── gen/android/                # Android Gradle project and native Kotlin source
│       └── app/src/main/
│           ├── AndroidManifest.xml # Permissions, activities, and broadcast receivers
│           └── java/com/intervalalarm/alarm/
│               ├── AlarmActionReceiver.kt  # Notification action handler
│               ├── AlarmPlugin.kt          # Tauri 2 Android native plugin
│               ├── AlarmReceiver.kt        # AlarmManager broadcast receiver
│               ├── AlarmRingingActivity.kt # Lock-screen ringing UI activity
│               ├── AlarmScheduler.kt       # Native exact alarm scheduling engine
│               ├── BootReceiver.kt         # System reboot and time-change recovery
│               ├── MainActivity.kt         # Main application activity and runtime permissions
│               ├── NativeStorage.kt        # SharedPreferences persistence engine
│               └── RingtonePlayer.kt       # Audio and vibration hardware coordinator
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **pnpm**: v9.0.0 or higher
- **Rust**: Latest stable toolchain with `aarch64-linux-android` target
  ```bash
  rustup target add aarch64-linux-android
  ```
- **Android SDK & NDK**: Command-line tools, platform SDK (API 34/35), and NDK (version 26+ or 30). Ensure `ANDROID_HOME` and `NDK_HOME` environment variables are configured.
- **Java Development Kit**: JDK 17 or JDK 21 (e.g., Android Studio JBR).

### Installation

Clone the repository and install frontend dependencies:

```bash
pnpm install
```

---

## Verification & Testing

### Rust Domain Unit Tests

Run the test suite verifying interval math, rollover, snooze isolation, and recovery:

```bash
cd src-tauri
cargo test
```

### Android Target Check

Verify that the Rust library compiles cleanly for the Android target:

```bash
cd src-tauri
cargo check --target aarch64-linux-android
```

### Frontend TypeScript Check & Bundle

Run type-checking and production bundling:

```bash
pnpm build
```

---

## Building the Android APK

To assemble the universal debug APK for Android:

```bash
pnpm tauri android build --target aarch64 --debug --apk
```

The output package will be generated at:
```text
src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk
```

### Installing via ADB

To install and launch on a connected physical device or emulator:

```bash
adb install -r "src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk"
adb shell am start -n com.intervalalarm.alarm/com.intervalalarm.alarm.MainActivity
```

---

## Documentation

Full documentation is available in the `docs/` directory:

- [System Documentation](docs/system.md): Android permissions, exact alarms, system recovery, and battery optimization rules.
- [Architecture Documentation](docs/architecture.md): Component diagrams, data flows, scheduler algorithms, and bridge mechanics.
- [Product Documentation](docs/product.md): Value proposition, sequence lifecycles, and use cases.
- [Design Documentation](docs/design.md): Circadian design tokens, color palette, typography, and UI specifications.
- [Brand Documentation](docs/brand.md): Naming architecture, brand voice, and identity standards.
