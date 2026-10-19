use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceRingtone {
    pub title: String,
    pub uri: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativePermissionStatus {
    pub exact_alarm_granted: bool,
    pub notifications_granted: bool,
    pub full_screen_intent_allowed: bool,
    pub battery_optimization_unrestricted: bool,
}

#[derive(Clone)]
pub struct AndroidBridge {
    #[cfg(target_os = "android")]
    handle: tauri::plugin::PluginHandle<tauri::Wry>,
}

unsafe impl Send for AndroidBridge {}
unsafe impl Sync for AndroidBridge {}

impl AndroidBridge {
    #[cfg(target_os = "android")]
    pub fn new(handle: tauri::plugin::PluginHandle<tauri::Wry>) -> Self {
        Self { handle }
    }

    #[cfg(not(target_os = "android"))]
    pub fn new() -> Self {
        Self {}
    }

    pub fn sync_alarms(&self, alarms_json: &str) -> Result<(), String> {
        #[cfg(target_os = "android")]
        {
            self.handle
                .run_mobile_plugin::<serde_json::Value>(
                    "syncAlarms",
                    serde_json::json!({ "alarmsJson": alarms_json }),
                )
                .map(|_| ())
                .map_err(|e| e.to_string())
        }
        #[cfg(not(target_os = "android"))]
        {
            let _ = alarms_json;
            Ok(())
        }
    }

    pub fn check_permissions(&self) -> Result<NativePermissionStatus, String> {
        #[cfg(target_os = "android")]
        {
            self.handle
                .run_mobile_plugin::<NativePermissionStatus>(
                    "getAlarmPermissions",
                    serde_json::json!({}),
                )
                .map_err(|e| e.to_string())
        }
        #[cfg(not(target_os = "android"))]
        {
            Ok(NativePermissionStatus {
                exact_alarm_granted: true,
                notifications_granted: true,
                full_screen_intent_allowed: true,
                battery_optimization_unrestricted: true,
            })
        }
    }

    pub fn open_settings(&self, setting_type: &str) -> Result<(), String> {
        #[cfg(target_os = "android")]
        {
            self.handle
                .run_mobile_plugin::<serde_json::Value>(
                    "openAppSettings",
                    serde_json::json!({ "type": setting_type }),
                )
                .map(|_| ())
                .map_err(|e| e.to_string())
        }
        #[cfg(not(target_os = "android"))]
        {
            let _ = setting_type;
            Ok(())
        }
    }

    pub fn get_device_ringtone(&self) -> Result<DeviceRingtone, String> {
        #[cfg(target_os = "android")]
        {
            self.handle
                .run_mobile_plugin::<DeviceRingtone>(
                    "getDeviceRingtone",
                    serde_json::json!({}),
                )
                .map_err(|e| e.to_string())
        }
        #[cfg(not(target_os = "android"))]
        {
            Ok(DeviceRingtone {
                title: "Device Alarm Ringtone".into(),
                uri: "".into(),
            })
        }
    }

    pub fn request_notification_permission(&self) -> Result<(), String> {
        #[cfg(target_os = "android")]
        {
            self.handle
                .run_mobile_plugin::<serde_json::Value>(
                    "requestNotificationPermission",
                    serde_json::json!({}),
                )
                .map(|_| ())
                .map_err(|e| e.to_string())
        }
        #[cfg(not(target_os = "android"))]
        {
            Ok(())
        }
    }
}
