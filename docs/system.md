# System Documentation

This document describes the runtime environment, Android operating system integration, permission models, lifecycle constraints, and persistence architecture for iAlarm (Interval Alarm).

---

## 1. Operating Environment & Compatibility

- **Target Platform**: Android (primary), Desktop (development / testing environment).
- **Minimum SDK**: API Level 24 (Android 7.0 Nougat).
- **Target SDK**: API Level 37 (Android 15 / QPR).
- **Tested Architecture**: `arm64-v8a` (aarch64).
- **Core Package Identifier**: `com.intervalalarm.alarm`.
- **Application Class**: `com.intervalalarm.alarm.MainActivity`.

---

## 2. Android Native Lifecycle & Background Execution

Mobile operating systems enforce aggressive resource-saving mechanisms when applications are in the background or devices are idle. A reliable interval alarm must operate without depending on an active Chromium WebView or JavaScript event loop.

### 2.1 The Problem with WebView and JavaScript Timers
When an Android device enters sleep mode:
1. The screen turns off.
2. The operating system suspends JavaScript execution within WebViews to preserve battery.
3. Timers (`setTimeout`, `setInterval`, Web Workers) become throttled or halted completely.
4. If memory pressure rises, the Android Low Memory Killer (LMK) terminates the application process.

### 2.2 Native AlarmManager Implementation
To guarantee execution, all alarm occurrences are scheduled directly with the Android `AlarmManager` service via native Kotlin (`AlarmScheduler.kt`):

- **API Used**: `AlarmManager.setAlarmClock(AlarmClockInfo, PendingIntent)`.
- **System Priority**: `setAlarmClock` is treated by Android as an explicit user alarm. It bypasses Doze mode restrictions, wakes the device's CPU, and instructs the system status bar and lock-screen to display the alarm clock icon with the targeted trigger time.
- **Intent Association**: Each scheduled occurrence generates a unique `PendingIntent` linked to `AlarmReceiver.kt` using an action filter `com.intervalalarm.alarm.ACTION_TRIGGER_ALARM`.

---

## 3. Permissions Architecture

The application implements a scoped permission model complying with Android 12, 13, and 14 security requirements.

| Permission | Protection Level | Purpose |
|---|---|---|
| `SCHEDULE_EXACT_ALARM` | Normal / Special App Access | Required on Android 12+ (API 31+) to register exact alarm clock instances. Managed by the user in Settings > Apps > Special app access > Alarms & reminders. |
| `POST_NOTIFICATIONS` | Runtime (Dangerous) | Required on Android 13+ (API 33+) to post alerts to the notification shade and present heads-up alerts. |
| `USE_FULL_SCREEN_INTENT` | Normal | Allows high-priority notifications to launch a full-screen lockscreen activity (`AlarmRingingActivity`) when the device is locked. |
| `WAKE_LOCK` | Normal | Allows acquiring power manager locks to keep the CPU running and turn the display on when an alarm fires. |
| `VIBRATE` | Normal | Enables tactile haptic feedback during alarm ringing. |
| `RECEIVE_BOOT_COMPLETED` | Normal | Notifies `BootReceiver.kt` when the device finishes booting to reconstruct registered alarms. |
| `FOREGROUND_SERVICE` | Normal | Enables emergency headless audio playback and notification maintenance. |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | Normal | Direct link permission allowing users to exempt iAlarm from aggressive manufacturer background killers. |

### 3.1 Exact Alarm Permission (`SCHEDULE_EXACT_ALARM` vs `USE_EXACT_ALARM`)
In Android 13+, Google introduced `USE_EXACT_ALARM` alongside `SCHEDULE_EXACT_ALARM`. 
- Declaring `USE_EXACT_ALARM` causes the operating system to hide the user-facing "Alarms & Reminders" toggle in the Android App Info menu.
- By declaring `SCHEDULE_EXACT_ALARM` directly, iAlarm ensures that the "Alarms & Reminders" control remains visible and configurable under App Info > Advanced > Special App Access on Android 12, 13, and 14.
- `AlarmScheduler.canScheduleExact(context)` verifies permission availability before registration. If revoked, it falls back to `setExactAndAllowWhileIdle` or directs the user to system settings.

### 3.2 Runtime Notification Flow (`POST_NOTIFICATIONS`)
On Android 13+ devices, notifications cannot be presented without explicit runtime consent.
1. On initial startup, `MainActivity.kt` checks `ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)`.
2. If ungranted, `ActivityCompat.requestPermissions` prompts the system consent dialog.
3. The in-app Settings diagnostics view (`SettingsView.tsx`) displays live status and provides a direct trigger button to re-request or open application settings.

---

## 4. Screen Wake & Keyguard Dismissal

When an alarm triggers while the device is sleeping, the screen must physically illuminate and present actionable controls without forcing the user to unlock the phone first.

### 4.1 WakeLock Acquisition
Inside `AlarmReceiver.onReceive`:
```kotlin
val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
val wakeLock = powerManager.newWakeLock(
    PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
    "IntervalAlarm:AlarmReceiverWakeLock"
)
wakeLock.acquire(3 * 60 * 1000L) // 3-minute timeout safety window
```
- `SCREEN_BRIGHT_WAKE_LOCK` and `ACQUIRE_CAUSES_WAKEUP` command the display backlight hardware to turn on.
- `ON_AFTER_RELEASE` keeps the screen briefly active if the user interacts with notification controls.

### 4.2 Lock-Screen Presentation (`AlarmRingingActivity`)
`AlarmRingingActivity.kt` configures window parameters during `onCreate`:
```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
    setShowWhenLocked(true)
    setTurnScreenOn(true)
    val km = getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
    km?.requestDismissKeyguard(this, null)
}
window.addFlags(
    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
)
```
In `AndroidManifest.xml`, the activity specifies:
- `android:showWhenLocked="true"`
- `android:turnScreenOn="true"`
- `android:inheritShowWhenLocked="true"`
- `android:launchMode="singleInstance"`

---

## 5. System Recovery & Environmental Changes

Android clears all pending alarms from `AlarmManager` whenever a device restarts. iAlarm implements automated recovery through `BootReceiver.kt`.

### 5.1 Monitored System Actions
The receiver listens for the following broadcast intents:
- `android.intent.action.BOOT_COMPLETED`: Device restart finished.
- `android.intent.action.MY_PACKAGE_REPLACED`: Application updated or reinstalled.
- `android.intent.action.TIME_SET`: User manually adjusted the system clock.
- `android.intent.action.TIMEZONE_CHANGED`: Device crossed into a new time zone.
- `android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED`: User toggled exact alarm permission in system settings.

### 5.2 Reconstruction Pipeline
Upon receiving any of these broadcasts:
1. `BootReceiver` acquires a temporary wake lock.
2. It loads persisted sequence definitions from `NativeStorage` (`SharedPreferences`).
3. For each enabled sequence, `AlarmScheduler.scheduleSequence` calculates the next valid occurrence strictly in the future relative to `System.currentTimeMillis()`.
4. Stale or past occurrences that passed while the device was off are discarded, preventing an audible barrage of expired alarms.
5. The next scheduled occurrence is committed to `AlarmManager`.

---

## 6. Persistence & Data Integrity

iAlarm employs a two-tier storage architecture to bridge web and native layers safely:

```text
[Frontend React State] 
        │
   (Tauri IPC)
        ▼
[Rust StorageManager]  ───writes───►  ~/.ialarm_data/alarms.json (Atomic File IO)
        │
(Auto-Sync Bridge)
        ▼
[Android NativeStorage] ───writes───►  SharedPreferences (XML Key-Value)
        │
        ▼
[AlarmManager Engine]
```

### 6.1 Rust Core Storage
- **File Location**: `<app_data_dir>/alarms.json`.
- **Atomic Writes**: Data is serialized to a `.tmp` file and renamed atomically to prevent corruption during unexpected shutdowns.
- **Schema Versioning**: Includes a schema version header allowing structured migrations between app releases.

### 6.2 Native Android Mirror
- **Preferences File**: `interval_alarm_native_store`.
- **Payload**: Full JSON representation of active `AlarmSequence` objects.
- **Purpose**: Enables native broadcast receivers to operate without initializing the Tauri Rust runtime or launching Chromium.

---

## 7. OEM Battery Optimization Considerations

Certain Android device manufacturers (Xiaomi/MIUI, Samsung/OneUI, Huawei/EMUI, Oppo/ColorOS) enforce aggressive background task termination policies beyond standard Android specifications.

### Recommended System Settings for Maximum Reliability
1. **Battery Optimization**: Exempt iAlarm from battery optimization via `Settings > Apps > iAlarm > Battery > Unrestricted`.
2. **Autostart Permission** (MIUI / ColorOS): Enable `Autostart` to allow `BootReceiver` to respond after reboots.
3. **Lock in Recent Apps**: Prevent aggressive task cleaners from clearing the notification channel.
