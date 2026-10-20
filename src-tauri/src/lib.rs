pub mod models;
pub mod scheduler;
pub mod storage;
pub mod commands;
pub mod android_bridge;

use std::path::PathBuf;
use tauri::{plugin::{Builder, TauriPlugin}, Manager};
use storage::StorageManager;
use android_bridge::AndroidBridge;

fn init_alarm_plugin() -> TauriPlugin<tauri::Wry> {
    Builder::new("alarm")
        .setup(|app, _api| {
            #[cfg(target_os = "android")]
            {
                let handle = _api.register_android_plugin("com.intervalalarm.alarm", "AlarmPlugin")?;
                let bridge = AndroidBridge::new(handle);
                app.manage(bridge);
            }
            #[cfg(not(target_os = "android"))]
            {
                let bridge = AndroidBridge::new();
                app.manage(bridge);
            }
            Ok(())
        })
        .build()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(init_alarm_plugin())
        .setup(|app| {
            let data_dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("./.ialarm_data"));
            let storage = StorageManager::new(data_dir);
            
            // Synchronize existing alarms to native on app startup
            let alarms = storage.get_alarms();
            app.manage(storage);

            if let Some(bridge) = app.try_state::<AndroidBridge>() {
                if let Ok(json) = serde_json::to_string(&alarms) {
                    let _ = bridge.sync_alarms(&json);
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_alarms,
            commands::get_alarm,
            commands::create_alarm,
            commands::update_alarm,
            commands::delete_alarm,
            commands::toggle_alarm,
            commands::preview_schedule,
            commands::dismiss_occurrence,
            commands::snooze_occurrence,
            commands::skip_next_occurrence,
            commands::get_app_settings,
            commands::update_app_settings,
            commands::export_data,
            commands::import_data,
            commands::check_native_permissions,
            commands::open_alarm_settings,
            commands::open_app_settings,
            commands::sync_alarms_to_native,
            commands::get_device_ringtone,
            commands::request_notification_permission,
            commands::get_alarm_logs,
            commands::clear_alarm_logs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
