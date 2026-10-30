use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};
use uuid::Uuid;

use crate::android_bridge::{AndroidBridge, DeviceRingtone, NativePermissionStatus};
use crate::models::{AlarmSequence, AlarmState, AppSettings, IntervalUnit, RepetitionMode, SchedulePreviewItem};
use crate::scheduler::Scheduler;
use crate::storage::StorageManager;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateAlarmPayload {
    pub name: String,
    pub category: String,
    pub start_time: i64,
    pub interval_value: u32,
    pub interval_unit: IntervalUnit,
    pub total_occurrences: u32,
    pub repetition_mode: RepetitionMode,
    pub selected_weekdays: Vec<u8>,
    pub sound: String,
    pub vibration: bool,
    pub snooze_duration_minutes: u32,
    pub snooze_max_count: u32,
    pub gradual_volume: bool,
}

fn sync_to_native(app: &AppHandle, storage: &StorageManager) {
    let alarms = storage.get_alarms();
    if let Ok(json) = serde_json::to_string(&alarms) {
        if let Some(bridge) = app.try_state::<AndroidBridge>() {
            let _ = bridge.sync_alarms(&json);
        }
    }
}

#[tauri::command]
pub fn get_alarms(
    app: AppHandle,
    storage: State<'_, StorageManager>,
) -> Vec<AlarmSequence> {
    #[cfg(target_os = "android")]
    {
        if let Some(bridge) = app.try_state::<AndroidBridge>() {
            if let Ok(native_alarms) = bridge.get_native_alarms() {
                if !native_alarms.is_empty() {
                    for a in &native_alarms {
                        let _ = storage.save_alarm(a.clone());
                    }
                    return native_alarms;
                }
            }
        }
    }
    let _ = app;
    storage.get_alarms()
}

#[tauri::command]
pub fn get_alarm(id: String, storage: State<'_, StorageManager>) -> Option<AlarmSequence> {
    storage.get_alarm(&id)
}

#[tauri::command]
pub fn create_alarm(
    payload: CreateAlarmPayload,
    app: AppHandle,
    storage: State<'_, StorageManager>,
) -> Result<AlarmSequence, String> {
    let now = Utc::now().timestamp_millis();
    let id = Uuid::new_v4().to_string();

    let sequence = AlarmSequence {
        id,
        name: payload.name,
        category: payload.category,
        enabled: true,
        start_time: payload.start_time,
        interval_value: payload.interval_value,
        interval_unit: payload.interval_unit,
        total_occurrences: payload.total_occurrences,
        repetition_mode: payload.repetition_mode,
        selected_weekdays: payload.selected_weekdays,
        sound: payload.sound,
        vibration: payload.vibration,
        snooze_duration_minutes: payload.snooze_duration_minutes,
        snooze_max_count: payload.snooze_max_count,
        gradual_volume: payload.gradual_volume,
        created_at: now,
        updated_at: now,
        current_occurrence_index: 0,
        state: AlarmState::Scheduled,
        next_trigger_time: None,
        snoozed_until: None,
        snooze_count: 0,
    };

    sequence.validate()?;

    // Compute next valid occurrence
    let (computed_seq, _) = Scheduler::compute_next_occurrence(&sequence, now);
    let res = storage.save_alarm(computed_seq);
    sync_to_native(&app, &storage);
    res
}

#[tauri::command]
pub fn update_alarm(
    alarm: AlarmSequence,
    app: AppHandle,
    storage: State<'_, StorageManager>,
) -> Result<AlarmSequence, String> {
    let now = Utc::now().timestamp_millis();
    let mut updated = alarm;
    updated.updated_at = now;
    updated.validate()?;

    let (computed_seq, _) = Scheduler::compute_next_occurrence(&updated, now);
    let res = storage.save_alarm(computed_seq);
    sync_to_native(&app, &storage);
    res
}

#[tauri::command]
pub fn delete_alarm(
    id: String,
    app: AppHandle,
    storage: State<'_, StorageManager>,
) -> Result<bool, String> {
    let res = storage.delete_alarm(&id);
    sync_to_native(&app, &storage);
    res
}

#[tauri::command]
pub fn toggle_alarm(
    id: String,
    enabled: bool,
    app: AppHandle,
    storage: State<'_, StorageManager>,
) -> Result<AlarmSequence, String> {
    let mut alarm = storage.get_alarm(&id).ok_or_else(|| format!("Alarm not found: {}", id))?;
    let now = Utc::now().timestamp_millis();

    alarm.enabled = enabled;
    alarm.updated_at = now;

    let res = if enabled {
        alarm.state = AlarmState::Scheduled;
        let (computed, _) = Scheduler::compute_next_occurrence(&alarm, now);
        storage.save_alarm(computed)
    } else {
        alarm.state = AlarmState::Disabled;
        alarm.next_trigger_time = None;
        alarm.snoozed_until = None;
        storage.save_alarm(alarm)
    };
    sync_to_native(&app, &storage);
    res
}

#[tauri::command]
pub fn preview_schedule(
    start_time_ms: i64,
    interval_value: u32,
    interval_unit: IntervalUnit,
    total_occurrences: u32,
    time_format_24h: bool,
) -> Vec<SchedulePreviewItem> {
    Scheduler::generate_preview(
        start_time_ms,
        interval_value,
        &interval_unit,
        total_occurrences,
        time_format_24h,
    )
}

#[tauri::command]
pub fn dismiss_occurrence(
    id: String,
    app: AppHandle,
    storage: State<'_, StorageManager>,
) -> Result<AlarmSequence, String> {
    let alarm = storage.get_alarm(&id).ok_or_else(|| format!("Alarm not found: {}", id))?;
    let now = Utc::now().timestamp_millis();
    let (advanced, _) = Scheduler::advance_on_dismiss(&alarm, now);
    let res = storage.save_alarm(advanced);
    sync_to_native(&app, &storage);
    res
}

#[tauri::command]
pub fn snooze_occurrence(
    id: String,
    app: AppHandle,
    storage: State<'_, StorageManager>,
) -> Result<AlarmSequence, String> {
    let alarm = storage.get_alarm(&id).ok_or_else(|| format!("Alarm not found: {}", id))?;
    let now = Utc::now().timestamp_millis();
    let (snoozed, _) = Scheduler::apply_snooze(&alarm, now)?;
    let res = storage.save_alarm(snoozed);
    sync_to_native(&app, &storage);
    res
}

#[tauri::command]
pub fn skip_next_occurrence(
    id: String,
    app: AppHandle,
    storage: State<'_, StorageManager>,
) -> Result<AlarmSequence, String> {
    let alarm = storage.get_alarm(&id).ok_or_else(|| format!("Alarm not found: {}", id))?;
    let now = Utc::now().timestamp_millis();
    let (advanced, _) = Scheduler::skip_next_occurrence(&alarm, now);
    let res = storage.save_alarm(advanced);
    sync_to_native(&app, &storage);
    res
}

#[tauri::command]
pub fn get_app_settings(storage: State<'_, StorageManager>) -> AppSettings {
    storage.get_settings()
}

#[tauri::command]
pub fn update_app_settings(
    settings: AppSettings,
    storage: State<'_, StorageManager>,
) -> Result<AppSettings, String> {
    storage.update_settings(settings)
}

#[tauri::command]
pub fn export_data(storage: State<'_, StorageManager>) -> Result<String, String> {
    storage.export_json()
}

#[tauri::command]
pub fn import_data(
    json_str: String,
    app: AppHandle,
    storage: State<'_, StorageManager>,
) -> Result<usize, String> {
    let res = storage.import_json(&json_str);
    sync_to_native(&app, &storage);
    res
}

#[tauri::command]
pub fn check_native_permissions(app: AppHandle) -> NativePermissionStatus {
    if let Some(bridge) = app.try_state::<AndroidBridge>() {
        return bridge.check_permissions().unwrap_or(NativePermissionStatus {
            exact_alarm_granted: true,
            notifications_granted: true,
            full_screen_intent_allowed: true,
            battery_optimization_unrestricted: true,
        });
    }
    NativePermissionStatus {
        exact_alarm_granted: true,
        notifications_granted: true,
        full_screen_intent_allowed: true,
        battery_optimization_unrestricted: true,
    }
}

#[tauri::command]
pub fn open_app_settings(
    setting_type: Option<String>,
    app: AppHandle,
) -> Result<(), String> {
    if let Some(bridge) = app.try_state::<AndroidBridge>() {
        return bridge.open_settings(&setting_type.unwrap_or_else(|| "app_details".into()));
    }
    Ok(())
}

#[tauri::command]
pub fn open_alarm_settings(app: AppHandle) -> Result<(), String> {
    open_app_settings(Some("exact_alarm".into()), app)
}

#[tauri::command]
pub fn sync_alarms_to_native(
    app: AppHandle,
    storage: State<'_, StorageManager>,
) -> Result<(), String> {
    sync_to_native(&app, &storage);
    Ok(())
}

#[tauri::command]
pub fn get_device_ringtone(app: AppHandle) -> Result<DeviceRingtone, String> {
    if let Some(bridge) = app.try_state::<AndroidBridge>() {
        return bridge.get_device_ringtone();
    }
    Ok(DeviceRingtone {
        title: "Device Alarm Ringtone".into(),
        uri: "".into(),
    })
}

#[tauri::command]
pub fn request_notification_permission(app: AppHandle) -> Result<(), String> {
    if let Some(bridge) = app.try_state::<AndroidBridge>() {
        return bridge.request_notification_permission();
    }
    Ok(())
}

#[tauri::command]
pub fn get_alarm_logs(app: AppHandle) -> Result<String, String> {
    if let Some(bridge) = app.try_state::<AndroidBridge>() {
        return bridge.get_alarm_logs();
    }
    Ok("[]".into())
}

#[tauri::command]
pub fn clear_alarm_logs(app: AppHandle) -> Result<(), String> {
    if let Some(bridge) = app.try_state::<AndroidBridge>() {
        return bridge.clear_alarm_logs();
    }
    Ok(())
}

#[tauri::command]
pub fn test_tone(tone: String, vibration: Option<bool>, app: AppHandle) -> Result<(), String> {
    if let Some(bridge) = app.try_state::<AndroidBridge>() {
        return bridge.test_tone(&tone, vibration.unwrap_or(false));
    }
    Ok(())
}

#[tauri::command]
pub fn stop_tone(app: AppHandle) -> Result<(), String> {
    if let Some(bridge) = app.try_state::<AndroidBridge>() {
        return bridge.stop_tone();
    }
    Ok(())
}
