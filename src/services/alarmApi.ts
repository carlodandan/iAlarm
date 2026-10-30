import { invoke } from "@tauri-apps/api/core";
import {
  AlarmSequence,
  AppSettings,
  CreateAlarmPayload,
  DeviceRingtone,
  NativePermissionStatus,
  SchedulePreviewItem,
} from "../types/alarm";

import bestAndroidAudio from "../assets/ringtones/best_android_rington.ogg";
import dandadanAudio from "../assets/ringtones/dandadan_01.ogg";
import detectiveConanAudio from "../assets/ringtones/detective_conan_01.ogg";
import gintamaAudio from "../assets/ringtones/gintama_01.ogg";
import jujutsuKaisenAudio from "../assets/ringtones/jujutsu_kaisen_01.ogg";
import miRemixAudio from "../assets/ringtones/mi_remix_miui12.ogg";
import nokiaAndroidAudio from "../assets/ringtones/nokia_android.ogg";
import onePiece01Audio from "../assets/ringtones/one_piece_01.ogg";
import onePiece02Audio from "../assets/ringtones/one_piece_02.ogg";
import onePiece03Audio from "../assets/ringtones/one_piece_03.ogg";
import oppoCalmAudio from "../assets/ringtones/oppo_calm.ogg";
import samsungGalaxyAudio from "../assets/ringtones/samsung_galaxy_s11.ogg";

const IS_TAURI = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

// Audio player for previewing sounds
let audioCtx: AudioContext | null = null;
let activeOscillators: OscillatorNode[] = [];
let activeAudioElement: HTMLAudioElement | null = null;
let currentPreviewId = 0;

export function isAudioOwner(previewId: number): boolean {
  return previewId === currentPreviewId;
}

export const CustomRingtoneAudios: Record<string, string> = {
  best_android_rington: bestAndroidAudio,
  dandadan_01: dandadanAudio,
  detective_conan_01: detectiveConanAudio,
  gintama_01: gintamaAudio,
  jujutsu_kaisen_01: jujutsuKaisenAudio,
  mi_remix_miui12: miRemixAudio,
  nokia_android: nokiaAndroidAudio,
  one_piece_01: onePiece01Audio,
  one_piece_02: onePiece02Audio,
  one_piece_03: onePiece03Audio,
  oppo_calm: oppoCalmAudio,
  samsung_galaxy_s11: samsungGalaxyAudio,
};

export const CustomRingtones = [
  { id: "best_android_rington", name: "Best Android", description: "Modern electro chime" },
  { id: "dandadan_01", name: "Dandadan", description: "High-energy anime beat" },
  { id: "detective_conan_01", name: "Detective Conan", description: "Classic suspense theme" },
  { id: "gintama_01", name: "Gintama", description: "Energetic anime cadence" },
  { id: "jujutsu_kaisen_01", name: "Jujutsu Kaisen", description: "Battle rhythm drive" },
  { id: "mi_remix_miui12", name: "Mi Remix (MIUI)", description: "Dynamic smartphone groove" },
  { id: "nokia_android", name: "Nokia Android", description: "Nostalgic modern tone" },
  { id: "one_piece_01", name: "One Piece 1", description: "Grand adventure fanfare" },
  { id: "one_piece_02", name: "One Piece 2", description: "Heroic journey motif" },
  { id: "one_piece_03", name: "One Piece 3", description: "Lively pirate crew rhythm" },
  { id: "oppo_calm", name: "Oppo Calm", description: "Gentle ambient wake" },
  { id: "samsung_galaxy_s11", name: "Samsung Galaxy", description: "Refined classic chime" },
];

export const LegacyPresets = [
  { id: "Aura Dawn", name: "Aura Dawn", description: "Circadian ambient ascending chime" },
  { id: "Celestial Chime", name: "Celestial Chime", description: "Ascending gentle bell harmonic" },
  { id: "Zen Bell", name: "Zen Bell", description: "Singing bowl with soft resonance" },
  { id: "Digital Pulse", name: "Digital Pulse", description: "Rhythmic dual synth cadence" },
  { id: "Horizon Flare", name: "Horizon Flare", description: "Vibrant energetic morning pulse" },
];

export const SoundPresets = [...CustomRingtones, ...LegacyPresets];

export function playTonePreview(presetName: string): number {
  stopTonePreview();
  const previewId = ++currentPreviewId;

  // 1. Check if it matches a custom ringtone audio file (plays cleanly in WebView)
  const customAudioUrl = CustomRingtoneAudios[presetName];
  if (customAudioUrl) {
    try {
      const audio = new Audio(customAudioUrl);
      audio.volume = 0.9;
      activeAudioElement = audio;
      audio.play().catch((err) => {
        console.warn("Audio play error:", err);
        if (IS_TAURI && activeAudioElement === audio) {
          invoke("test_tone", { tone: presetName, vibration: false }).catch(() => {});
        }
      });
      return previewId;
    } catch (e) {
      console.warn("Failed to play custom ringtone preview:", e);
      if (IS_TAURI) {
        invoke("test_tone", { tone: presetName, vibration: false }).catch(() => {});
        return previewId;
      }
    }
  }

  // 2. If running on native Android, test non-legacy tone (e.g. device default) via native RingtonePlayer
  const isLegacyPreset = LegacyPresets.some((p) => p.id === presetName);
  if (!isLegacyPreset && IS_TAURI && typeof navigator !== "undefined" && /android/i.test(navigator.userAgent)) {
    invoke("test_tone", { tone: presetName, vibration: false }).catch(() => {});
    return previewId;
  }

  // 3. Fall back to Web Audio oscillator synth for legacy presets in browser
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return previewId;

    audioCtx = new AudioContextClass();
    const now = audioCtx.currentTime;

    const playNote = (freq: number, startOffset: number, duration: number, type: OscillatorType = "sine") => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + startOffset);

      gain.gain.setValueAtTime(0.001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.3, now + startOffset + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.1);
      activeOscillators.push(osc);
    };

    switch (presetName) {
      case "Celestial Chime":
        playNote(523.25, 0, 0.4); // C5
        playNote(659.25, 0.2, 0.4); // E5
        playNote(783.99, 0.4, 0.5); // G5
        playNote(1046.5, 0.6, 0.8); // C6
        break;
      case "Zen Bell":
        playNote(432.0, 0, 1.5, "sine");
        playNote(864.0, 0, 1.2, "triangle");
        break;
      case "Digital Pulse":
        playNote(880, 0, 0.1, "square");
        playNote(880, 0.15, 0.1, "square");
        playNote(1174.66, 0.3, 0.25, "square");
        break;
      case "Horizon Flare":
        playNote(440, 0, 0.2, "sawtooth");
        playNote(554.37, 0.15, 0.2, "sawtooth");
        playNote(659.25, 0.3, 0.4, "sine");
        break;
      case "Aura Dawn":
      default:
        playNote(392.0, 0, 0.5); // G4
        playNote(440.0, 0.15, 0.5); // A4
        playNote(523.25, 0.3, 0.6); // C5
        playNote(659.25, 0.45, 0.9); // E5
        break;
    }
  } catch (e) {
    console.warn("Audio preview failed:", e);
  }
  return previewId;
}

export function stopTonePreview(previewId?: number) {
  if (previewId !== undefined && previewId !== currentPreviewId) {
    return;
  }
  currentPreviewId++;

  if (IS_TAURI) {
    invoke("stop_tone").catch(() => {});
  }

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudioElement = null;
  }

  for (const osc of activeOscillators) {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // ignore
    }
  }
  activeOscillators = [];
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
  }
}

// Fallback Local Storage for non-Tauri dev mode
const STORAGE_KEY = "ialarm_sequences_store";
const SETTINGS_KEY = "ialarm_settings_store";

function getFallbackAlarms(): AlarmSequence[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const demo: AlarmSequence[] = [
        {
          id: "demo-meds-1",
          name: "Medication Protocol",
          category: "medication",
          enabled: true,
          start_time: Date.now() + 1000 * 60 * 60 * 4, // in 4 hours
          interval_value: 4,
          interval_unit: "hours",
          total_occurrences: 5,
          repetition_mode: "weekdays",
          selected_weekdays: [1, 2, 3, 4, 5],
          sound: "Celestial Chime",
          vibration: true,
          snooze_duration_minutes: 10,
          snooze_max_count: 3,
          gradual_volume: true,
          created_at: Date.now(),
          updated_at: Date.now(),
          current_occurrence_index: 1,
          state: "scheduled",
          next_trigger_time: Date.now() + 1000 * 60 * 60 * 4,
          snoozed_until: null,
          snooze_count: 0,
        },
        {
          id: "demo-focus-2",
          name: "Focus & Sprint Blocks",
          category: "focus",
          enabled: true,
          start_time: Date.now() + 1000 * 60 * 90, // in 90 min
          interval_value: 90,
          interval_unit: "minutes",
          total_occurrences: 4,
          repetition_mode: "one_time",
          selected_weekdays: [],
          sound: "best_android_rington",
          vibration: true,
          snooze_duration_minutes: 5,
          snooze_max_count: 2,
          gradual_volume: true,
          created_at: Date.now(),
          updated_at: Date.now(),
          current_occurrence_index: 0,
          state: "scheduled",
          next_trigger_time: Date.now() + 1000 * 60 * 90,
          snoozed_until: null,
          snooze_count: 0,
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
      return demo;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveFallbackAlarms(alarms: AlarmSequence[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  } catch {
    // ignore
  }
}

export const AlarmApi = {
  async getAlarms(): Promise<AlarmSequence[]> {
    if (IS_TAURI) {
      try {
        return await invoke<AlarmSequence[]>("get_alarms");
      } catch (e) {
        console.error("Failed to get_alarms from Tauri, fallback to local:", e);
      }
    }
    return getFallbackAlarms();
  },

  async getAlarm(id: string): Promise<AlarmSequence | null> {
    if (IS_TAURI) {
      try {
        return await invoke<AlarmSequence | null>("get_alarm", { id });
      } catch (e) {
        console.error("Failed get_alarm from Tauri:", e);
      }
    }
    const all = getFallbackAlarms();
    return all.find((a) => a.id === id) || null;
  },

  async createAlarm(payload: CreateAlarmPayload): Promise<AlarmSequence> {
    if (IS_TAURI) {
      return await invoke<AlarmSequence>("create_alarm", { payload });
    }
    const alarms = getFallbackAlarms();
    const now = Date.now();
    const newSeq: AlarmSequence = {
      id: "seq-" + Math.random().toString(36).substring(2, 9),
      ...payload,
      enabled: true,
      created_at: now,
      updated_at: now,
      current_occurrence_index: 0,
      state: "scheduled",
      next_trigger_time: payload.start_time,
      snoozed_until: null,
      snooze_count: 0,
    };
    alarms.push(newSeq);
    saveFallbackAlarms(alarms);
    return newSeq;
  },

  async updateAlarm(alarm: AlarmSequence): Promise<AlarmSequence> {
    if (IS_TAURI) {
      return await invoke<AlarmSequence>("update_alarm", { alarm });
    }
    const alarms = getFallbackAlarms();
    const index = alarms.findIndex((a) => a.id === alarm.id);
    if (index >= 0) {
      alarms[index] = { ...alarm, updated_at: Date.now() };
      saveFallbackAlarms(alarms);
    }
    return alarm;
  },

  async deleteAlarm(id: string): Promise<boolean> {
    if (IS_TAURI) {
      return await invoke<boolean>("delete_alarm", { id });
    }
    const alarms = getFallbackAlarms().filter((a) => a.id !== id);
    saveFallbackAlarms(alarms);
    return true;
  },

  async toggleAlarm(id: string, enabled: boolean): Promise<AlarmSequence> {
    if (IS_TAURI) {
      return await invoke<AlarmSequence>("toggle_alarm", { id, enabled });
    }
    const alarms = getFallbackAlarms();
    const alarm = alarms.find((a) => a.id === id);
    if (!alarm) throw new Error("Alarm not found");
    alarm.enabled = enabled;
    alarm.state = enabled ? "scheduled" : "disabled";
    alarm.updated_at = Date.now();
    saveFallbackAlarms(alarms);
    return alarm;
  },

  async previewSchedule(
    startTimeMs: number,
    intervalValue: number,
    intervalUnit: "minutes" | "hours",
    totalOccurrences: number,
    timeFormat24h: boolean
  ): Promise<SchedulePreviewItem[]> {
    if (IS_TAURI) {
      return await invoke<SchedulePreviewItem[]>("preview_schedule", {
        startTimeMs,
        intervalValue,
        intervalUnit,
        totalOccurrences,
        timeFormat24h,
      });
    }

    const intervalMs =
      intervalUnit === "minutes" ? intervalValue * 60 * 1000 : intervalValue * 3600 * 1000;
    const items: SchedulePreviewItem[] = [];

    for (let i = 0; i < totalOccurrences; i++) {
      const trigger = startTimeMs + i * intervalMs;
      const dt = new Date(trigger);
      const hours = dt.getHours();
      const minutes = dt.getMinutes();
      const formatted = timeFormat24h
        ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
        : `${(hours % 12 || 12).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;

      const hoursOffset = Math.floor((i * intervalMs) / (3600 * 1000));
      const dayDiff = Math.floor(
        (new Date(dt.toDateString()).getTime() - new Date(new Date(startTimeMs).toDateString()).getTime()) /
          (86400 * 1000)
      );

      const dayOffsetLabel =
        i === 0
          ? "Genesis"
          : dayDiff > 0
          ? `+${dayDiff}d (+${hoursOffset}h)`
          : `+${hoursOffset}h`;

      items.push({
        occurrence_index: i,
        trigger_time: trigger,
        formatted_time: formatted,
        day_offset_label: dayOffsetLabel,
        label: i === 0 ? "Initial Start" : i === totalOccurrences - 1 ? "Final Sequence Marker" : `Cadence step ${i + 1}`,
      });
    }
    return items;
  },

  async dismissOccurrence(id: string): Promise<AlarmSequence> {
    if (IS_TAURI) {
      return await invoke<AlarmSequence>("dismiss_occurrence", { id });
    }
    const alarms = getFallbackAlarms();
    const alarm = alarms.find((a) => a.id === id);
    if (!alarm) throw new Error("Alarm not found");
    alarm.current_occurrence_index += 1;
    if (alarm.current_occurrence_index >= alarm.total_occurrences) {
      alarm.state = "completed";
      alarm.enabled = false;
      alarm.next_trigger_time = null;
    }
    alarm.updated_at = Date.now();
    saveFallbackAlarms(alarms);
    return alarm;
  },

  async snoozeOccurrence(id: string): Promise<AlarmSequence> {
    if (IS_TAURI) {
      return await invoke<AlarmSequence>("snooze_occurrence", { id });
    }
    const alarms = getFallbackAlarms();
    const alarm = alarms.find((a) => a.id === id);
    if (!alarm) throw new Error("Alarm not found");
    alarm.state = "snoozed";
    alarm.snooze_count += 1;
    alarm.snoozed_until = Date.now() + alarm.snooze_duration_minutes * 60 * 1000;
    alarm.next_trigger_time = alarm.snoozed_until;
    saveFallbackAlarms(alarms);
    return alarm;
  },

  async skipNextOccurrence(id: string): Promise<AlarmSequence> {
    if (IS_TAURI) {
      return await invoke<AlarmSequence>("skip_next_occurrence", { id });
    }
    return this.dismissOccurrence(id);
  },

  async getAppSettings(): Promise<AppSettings> {
    if (IS_TAURI) {
      try {
        return await invoke<AppSettings>("get_app_settings");
      } catch (e) {
        console.error("Failed to get_app_settings from Tauri:", e);
      }
    }
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return {
      display_theme: "dark",
      time_format: "12h",
      default_snooze_minutes: 10,
      default_vibration: true,
      default_gradual_volume: true,
      default_sound: "best_android_rington",
      battery_optimization_unrestricted: true,
      exact_alarm_permission_granted: true,
      full_screen_intent_allowed: true,
      notifications_allowed: true,
    };
  },

  async updateAppSettings(settings: AppSettings): Promise<AppSettings> {
    if (IS_TAURI) {
      return await invoke<AppSettings>("update_app_settings", { settings });
    }
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
    return settings;
  },

  async exportData(): Promise<string> {
    if (IS_TAURI) {
      return await invoke<string>("export_data");
    }
    return JSON.stringify({ alarms: getFallbackAlarms() }, null, 2);
  },

  async importData(json: string): Promise<number> {
    if (IS_TAURI) {
      return await invoke<number>("import_data", { jsonStr: json });
    }
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed.alarms)) {
      saveFallbackAlarms(parsed.alarms);
      return parsed.alarms.length;
    }
    return 0;
  },

  async checkNativePermissions(): Promise<NativePermissionStatus> {
    if (IS_TAURI) {
      try {
        return await invoke<NativePermissionStatus>("check_native_permissions");
      } catch (e) {
        console.error("Failed check_native_permissions:", e);
      }
    }
    return {
      exact_alarm_granted: true,
      notifications_granted: true,
      full_screen_intent_allowed: true,
      battery_optimization_unrestricted: true,
    };
  },

  async openAppSettings(type: "app_details" | "exact_alarm" | "notifications" | "battery" = "app_details"): Promise<void> {
    if (IS_TAURI) {
      try {
        await invoke("open_app_settings", { settingType: type });
      } catch (e) {
        console.error("Failed open_app_settings:", e);
      }
    }
  },

  async openAlarmSettings(): Promise<void> {
    return this.openAppSettings("exact_alarm");
  },

  async getDeviceRingtone(): Promise<DeviceRingtone> {
    if (IS_TAURI) {
      try {
        return await invoke<DeviceRingtone>("get_device_ringtone");
      } catch (e) {
        console.error("Failed to get device ringtone:", e);
      }
    }
    return { title: "System Default Alarm Tone", uri: "" };
  },

  async requestNotificationPermission(): Promise<void> {
    if (IS_TAURI) {
      try {
        await invoke("request_notification_permission");
      } catch (e) {
        console.error("Failed to request notification permission:", e);
      }
    }
  },

  async syncWithAndroid(_alarms: AlarmSequence[]): Promise<void> {
    if (IS_TAURI) {
      try {
        await invoke("sync_alarms_to_native");
      } catch (e) {
        console.log("Native sync skipped:", e);
      }
    }
  },

  async testTone(tone: string, vibration: boolean = false): Promise<void> {
    if (IS_TAURI) {
      try {
        await invoke("test_tone", { tone, vibration });
      } catch (e) {
        console.error("Failed test_tone:", e);
      }
    }
  },

  async stopTone(): Promise<void> {
    if (IS_TAURI) {
      try {
        await invoke("stop_tone");
      } catch (e) {
        console.error("Failed stop_tone:", e);
      }
    }
  },
};


