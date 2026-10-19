export type IntervalUnit = "minutes" | "hours";

export type RepetitionMode = "one_time" | "daily" | "weekdays" | "continuous";

export type AlarmState =
  | "scheduled"
  | "ringing"
  | "snoozed"
  | "dismissed"
  | "skipped"
  | "completed"
  | "disabled"
  | "permission_blocked";

export interface SchedulePreviewItem {
  occurrence_index: number;
  trigger_time: number;
  formatted_time: string;
  day_offset_label: string;
  label: string;
}

export interface AlarmSequence {
  id: string;
  name: string;
  category: string; // "medication" | "hydration" | "fitness" | "focus" | "custom"
  enabled: boolean;
  start_time: number; // epoch ms
  interval_value: number;
  interval_unit: IntervalUnit;
  total_occurrences: number;
  repetition_mode: RepetitionMode;
  selected_weekdays: number[]; // 1 = Monday .. 7 = Sunday
  sound: string;
  vibration: boolean;
  snooze_duration_minutes: number;
  snooze_max_count: number;
  gradual_volume: boolean;
  created_at: number;
  updated_at: number;
  current_occurrence_index: number;
  state: AlarmState;
  next_trigger_time: number | null;
  snoozed_until: number | null;
  snooze_count: number;
}

export interface CreateAlarmPayload {
  name: string;
  category: string;
  start_time: number;
  interval_value: number;
  interval_unit: IntervalUnit;
  total_occurrences: number;
  repetition_mode: RepetitionMode;
  selected_weekdays: number[];
  sound: string;
  vibration: boolean;
  snooze_duration_minutes: number;
  snooze_max_count: number;
  gradual_volume: boolean;
}

export interface AppSettings {
  display_theme: string; // "system" | "dark" | "light"
  time_format: string; // "12h" | "24h"
  default_snooze_minutes: number;
  default_vibration: boolean;
  default_gradual_volume: boolean;
  default_sound: string;
  battery_optimization_unrestricted: boolean;
  exact_alarm_permission_granted: boolean;
  full_screen_intent_allowed: boolean;
  notifications_allowed: boolean;
}

export interface NativePermissionStatus {
  exact_alarm_granted: boolean;
  notifications_granted: boolean;
  full_screen_intent_allowed: boolean;
  battery_optimization_unrestricted: boolean;
}

export interface DeviceRingtone {
  title: string;
  uri: string;
}


