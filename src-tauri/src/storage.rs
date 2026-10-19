use std::fs;
use std::path::PathBuf;
use std::sync::RwLock;
use serde::{Deserialize, Serialize};

use crate::models::{AlarmSequence, AppSettings};

#[derive(Debug, Serialize, Deserialize)]
pub struct StoredData {
    pub schema_version: u32,
    pub alarms: Vec<AlarmSequence>,
    pub settings: AppSettings,
}

impl Default for StoredData {
    fn default() -> Self {
        Self {
            schema_version: 2,
            alarms: Vec::new(),
            settings: AppSettings::default(),
        }
    }
}

pub struct StorageManager {
    file_path: PathBuf,
    data: RwLock<StoredData>,
}

impl StorageManager {
    pub fn new(data_dir: PathBuf) -> Self {
        let _ = fs::create_dir_all(&data_dir);
        let file_path = data_dir.join("interval_alarms.json");

        let initial_data = if file_path.exists() {
            match fs::read_to_string(&file_path) {
                Ok(content) => match serde_json::from_str::<StoredData>(&content) {
                    Ok(parsed) => parsed,
                    Err(err) => {
                        eprintln!("[Storage] Failed to parse existing data file: {}, creating fallback", err);
                        StoredData::default()
                    }
                },
                Err(err) => {
                    eprintln!("[Storage] Failed to read data file: {}, creating fallback", err);
                    StoredData::default()
                }
            }
        } else {
            StoredData::default()
        };

        Self {
            file_path,
            data: RwLock::new(initial_data),
        }
    }

    pub fn get_alarms(&self) -> Vec<AlarmSequence> {
        let guard = self.data.read().unwrap();
        guard.alarms.clone()
    }

    pub fn get_alarm(&self, id: &str) -> Option<AlarmSequence> {
        let guard = self.data.read().unwrap();
        guard.alarms.iter().find(|a| a.id == id).cloned()
    }

    pub fn save_alarm(&self, alarm: AlarmSequence) -> Result<AlarmSequence, String> {
        alarm.validate()?;
        let mut guard = self.data.write().unwrap();
        let mut found = false;

        for existing in guard.alarms.iter_mut() {
            if existing.id == alarm.id {
                *existing = alarm.clone();
                found = true;
                break;
            }
        }

        if !found {
            guard.alarms.push(alarm.clone());
        }

        self.persist_locked(&guard)?;
        Ok(alarm)
    }

    pub fn delete_alarm(&self, id: &str) -> Result<bool, String> {
        let mut guard = self.data.write().unwrap();
        let initial_len = guard.alarms.len();
        guard.alarms.retain(|a| a.id != id);
        let removed = guard.alarms.len() < initial_len;

        if removed {
            self.persist_locked(&guard)?;
        }

        Ok(removed)
    }

    pub fn get_settings(&self) -> AppSettings {
        let guard = self.data.read().unwrap();
        guard.settings.clone()
    }

    pub fn update_settings(&self, settings: AppSettings) -> Result<AppSettings, String> {
        let mut guard = self.data.write().unwrap();
        guard.settings = settings.clone();
        self.persist_locked(&guard)?;
        Ok(settings)
    }

    pub fn export_json(&self) -> Result<String, String> {
        let guard = self.data.read().unwrap();
        serde_json::to_string_pretty(&*guard).map_err(|e| e.to_string())
    }

    pub fn import_json(&self, json_str: &str) -> Result<usize, String> {
        let imported: StoredData = serde_json::from_str(json_str).map_err(|e| format!("Invalid JSON structure: {}", e))?;
        let count = imported.alarms.len();

        let mut guard = self.data.write().unwrap();
        guard.alarms = imported.alarms;
        guard.settings = imported.settings;
        self.persist_locked(&guard)?;

        Ok(count)
    }

    fn persist_locked(&self, data: &StoredData) -> Result<(), String> {
        let json_str = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
        let tmp_path = self.file_path.with_extension("tmp");

        fs::write(&tmp_path, json_str).map_err(|e| format!("Failed to write temporary file: {}", e))?;
        fs::rename(&tmp_path, &self.file_path).map_err(|e| format!("Failed to commit persistence file: {}", e))?;

        Ok(())
    }
}
