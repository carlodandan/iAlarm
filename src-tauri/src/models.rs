use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum IntervalUnit {
    Minutes,
    Hours,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RepetitionMode {
    OneTime,
    Daily,
    Weekdays,
    Continuous,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AlarmState {
    Scheduled,
    Ringing,
    Snoozed,
    Dismissed,
    Skipped,
    Completed,
    Disabled,
    PermissionBlocked,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Occurrence {
    pub occurrence_index: u32,
    pub total_occurrences: u32,
    pub trigger_time: i64, // epoch milliseconds
    pub is_snooze: bool,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchedulePreviewItem {
    pub occurrence_index: u32,
    pub trigger_time: i64, // epoch ms
    pub formatted_time: String,
    pub day_offset_label: String, // e.g. "Genesis", "+6h", "+12h", "+1 Day (+18h)"
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlarmSequence {
    pub id: String,
    pub name: String,
    pub category: String, // e.g. "medication", "hydration", "fitness", "focus", "custom"
    pub enabled: bool,
    pub start_time: i64, // epoch milliseconds for first occurrence anchor
    pub interval_value: u32, // e.g. 6
    pub interval_unit: IntervalUnit, // Minutes or Hours
    pub total_occurrences: u32, // e.g. 4
    pub repetition_mode: RepetitionMode,
    pub selected_weekdays: Vec<u8>, // 1 = Monday .. 7 = Sunday (ISO weekday)
    pub sound: String, // e.g. "Aura Dawn", "Celestial Chime", "Radar", "Beacon"
    pub vibration: bool,
    pub snooze_duration_minutes: u32, // e.g. 10
    pub snooze_max_count: u32, // e.g. 3
    pub gradual_volume: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub current_occurrence_index: u32,
    pub state: AlarmState,
    pub next_trigger_time: Option<i64>, // epoch ms of next scheduled alarm
    pub snoozed_until: Option<i64>,
    pub snooze_count: u32,
}

impl AlarmSequence {
    pub fn validate(&self) -> Result<(), String> {
        if self.name.trim().is_empty() {
            return Err("Alarm name cannot be empty".to_string());
        }
        if self.interval_value == 0 {
            return Err("Interval value must be greater than 0".to_string());
        }
        if self.interval_value > 1440 && self.interval_unit == IntervalUnit::Minutes {
            return Err("Interval in minutes cannot exceed 24 hours (1440m)".to_string());
        }
        if self.interval_value > 72 && self.interval_unit == IntervalUnit::Hours {
            return Err("Interval in hours cannot exceed 72 hours".to_string());
        }
        if self.total_occurrences == 0 {
            return Err("Total occurrences must be at least 1".to_string());
        }
        if self.total_occurrences > 100 {
            return Err("Total occurrences cannot exceed 100".to_string());
        }
        if self.repetition_mode == RepetitionMode::Weekdays && self.selected_weekdays.is_empty() {
            return Err("At least one weekday must be selected for weekday repetition".to_string());
        }
        Ok(())
    }

    pub fn interval_duration_ms(&self) -> i64 {
        match self.interval_unit {
            IntervalUnit::Minutes => (self.interval_value as i64) * 60 * 1000,
            IntervalUnit::Hours => (self.interval_value as i64) * 3600 * 1000,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub display_theme: String, // "system", "dark", "light"
    pub time_format: String, // "12h", "24h"
    pub default_snooze_minutes: u32,
    pub default_vibration: bool,
    pub default_gradual_volume: bool,
    pub default_sound: String,
    pub battery_optimization_unrestricted: bool,
    pub exact_alarm_permission_granted: bool,
    pub full_screen_intent_allowed: bool,
    pub notifications_allowed: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            display_theme: "dark".to_string(),
            time_format: "12h".to_string(),
            default_snooze_minutes: 10,
            default_vibration: true,
            default_gradual_volume: true,
            default_sound: "best_android_rington".to_string(),
            battery_optimization_unrestricted: false,
            exact_alarm_permission_granted: false,
            full_screen_intent_allowed: false,
            notifications_allowed: false,
        }
    }
}

