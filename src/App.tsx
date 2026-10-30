import { useState, useEffect, useCallback } from "react";
import {
  AlarmSequence,
  AppSettings,
  CreateAlarmPayload,
  NativePermissionStatus,
} from "./types/alarm";
import { AlarmApi } from "./services/alarmApi";
import { HomeOverview } from "./components/HomeOverview";
import { CreateAlarmModal } from "./components/CreateAlarmModal";
import { SequenceDetailsModal } from "./components/SequenceDetailsModal";
import { SettingsView } from "./components/SettingsView";
import { AlarmRingingModal } from "./components/AlarmRingingModal";
import "./App.css";

export function App() {
  const [view, setView] = useState<"home" | "settings">("home");
  const [alarms, setAlarms] = useState<AlarmSequence[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
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
  });
  const [permissions, setPermissions] = useState<NativePermissionStatus>({
    exact_alarm_granted: true,
    notifications_granted: true,
    full_screen_intent_allowed: true,
    battery_optimization_unrestricted: true,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<AlarmSequence | null>(null);
  const [detailAlarm, setDetailAlarm] = useState<AlarmSequence | null>(null);
  const [ringingAlarm, setRingingAlarm] = useState<AlarmSequence | null>(null);

  const loadData = useCallback(async () => {
    try {
      await AlarmApi.requestNotificationPermission();
      const [loadedAlarms, loadedSettings, perms] = await Promise.all([
        AlarmApi.getAlarms(),
        AlarmApi.getAppSettings(),
        AlarmApi.checkNativePermissions(),
      ]);
      setAlarms(loadedAlarms);
      setSettings(loadedSettings);
      setPermissions(perms);
    } catch (e) {
      console.error("Failed to load initial data:", e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Web preview fallback only (in a desktop browser without native Android AlarmManager)
  useEffect(() => {
    // In Tauri / Android, native AlarmManager and AlarmPlaybackService handle all alarms natively.
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) return;

    const interval = setInterval(() => {
      if (ringingAlarm) return;
      const now = Date.now();
      // In browser preview, only trigger if due within the last 5 seconds (not an old past alarm)
      const due = alarms.find(
        (a) =>
          a.enabled &&
          a.next_trigger_time &&
          a.next_trigger_time <= now &&
          now - a.next_trigger_time < 5000 &&
          a.state !== "completed" &&
          a.state !== "disabled"
      );
      if (due) {
        setRingingAlarm(due);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms, ringingAlarm]);

  // Theme application to body/html
  useEffect(() => {
    if (settings.display_theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [settings.display_theme]);

  const handleToggleAlarm = async (id: string, enabled: boolean) => {
    try {
      const updated = await AlarmApi.toggleAlarm(id, enabled);
      setAlarms((prev) => prev.map((a) => (a.id === id ? updated : a)));
      if (detailAlarm?.id === id) {
        setDetailAlarm(updated);
      }
    } catch (e) {
      console.error("Failed to toggle alarm:", e);
    }
  };

  const handleSaveAlarm = async (payload: CreateAlarmPayload) => {
    if (editingAlarm) {
      const updated: AlarmSequence = {
        ...editingAlarm,
        ...payload,
        updated_at: Date.now(),
      };
      const res = await AlarmApi.updateAlarm(updated);
      setAlarms((prev) => prev.map((a) => (a.id === res.id ? res : a)));
      if (detailAlarm?.id === res.id) setDetailAlarm(res);
      setEditingAlarm(null);
    } else {
      const created = await AlarmApi.createAlarm(payload);
      setAlarms((prev) => [...prev, created]);
    }
    setIsCreateOpen(false);
  };

  const handleDeleteAlarm = async (id: string) => {
    try {
      await AlarmApi.deleteAlarm(id);
      setAlarms((prev) => prev.filter((a) => a.id !== id));
      if (detailAlarm?.id === id) setDetailAlarm(null);
    } catch (e) {
      console.error("Failed to delete alarm:", e);
    }
  };

  const handleSkipNext = async (id: string) => {
    try {
      const updated = await AlarmApi.skipNextOccurrence(id);
      setAlarms((prev) => prev.map((a) => (a.id === id ? updated : a)));
      if (detailAlarm?.id === id) setDetailAlarm(updated);
    } catch (e) {
      console.error("Failed to skip next occurrence:", e);
    }
  };

  const handleDismissRinging = async () => {
    if (!ringingAlarm) return;
    try {
      const updated = await AlarmApi.dismissOccurrence(ringingAlarm.id);
      setAlarms((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (detailAlarm?.id === updated.id) setDetailAlarm(updated);
    } finally {
      setRingingAlarm(null);
    }
  };

  const handleSnoozeRinging = async () => {
    if (!ringingAlarm) return;
    try {
      const updated = await AlarmApi.snoozeOccurrence(ringingAlarm.id);
      setAlarms((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (detailAlarm?.id === updated.id) setDetailAlarm(updated);
    } finally {
      setRingingAlarm(null);
    }
  };

  const handleDuplicate = async (alarm: AlarmSequence) => {
    const payload: CreateAlarmPayload = {
      name: `${alarm.name} (Copy)`,
      category: alarm.category,
      start_time: alarm.start_time,
      interval_value: alarm.interval_value,
      interval_unit: alarm.interval_unit,
      total_occurrences: alarm.total_occurrences,
      repetition_mode: alarm.repetition_mode,
      selected_weekdays: alarm.selected_weekdays,
      sound: alarm.sound,
      vibration: alarm.vibration,
      snooze_duration_minutes: alarm.snooze_duration_minutes,
      snooze_max_count: alarm.snooze_max_count,
      gradual_volume: alarm.gradual_volume,
    };
    const created = await AlarmApi.createAlarm(payload);
    setAlarms((prev) => [...prev, created]);
    setDetailAlarm(created);
  };

  const handleExportData = async () => {
    try {
      const json = await AlarmApi.exportData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interval_alarms_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export data: " + e);
    }
  };

  const handleImportData = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const count = await AlarmApi.importData(text);
        alert(`Successfully imported ${count} sequences!`);
        await loadData();
      } catch (err) {
        alert("Failed to import JSON: " + err);
      }
    };
    input.click();
  };

  return (
    <div className="relative min-h-screen bg-[#121316] text-[#e3e2e6] selection:bg-[#c8bfff] selection:text-[#121316]">
      {/* Main Views */}
      {view === "home" ? (
        <HomeOverview
          alarms={alarms}
          settings={settings}
          onSelectAlarm={(a) => setDetailAlarm(a)}
          onToggleAlarm={handleToggleAlarm}
          onCreateNew={() => {
            setEditingAlarm(null);
            setIsCreateOpen(true);
          }}
          onOpenSettings={() => setView("settings")}
        />
      ) : (
        <SettingsView
          settings={settings}
          permissions={permissions}
          onUpdateSettings={async (newSet) => {
            const updated = await AlarmApi.updateAppSettings(newSet);
            setSettings(updated);
          }}
          onClose={() => setView("home")}
          onExport={handleExportData}
          onImport={handleImportData}
        />
      )}

      {/* Sequence Details Modal */}
      {detailAlarm && !isCreateOpen && (
        <SequenceDetailsModal
          alarm={detailAlarm}
          settings={settings}
          onClose={() => setDetailAlarm(null)}
          onToggle={(enabled) => handleToggleAlarm(detailAlarm.id, enabled)}
          onSkipNext={() => handleSkipNext(detailAlarm.id)}
          onEdit={() => {
            setEditingAlarm(detailAlarm);
            setIsCreateOpen(true);
          }}
          onDuplicate={() => handleDuplicate(detailAlarm)}
          onDelete={() => handleDeleteAlarm(detailAlarm.id)}
        />
      )}

      {/* Create / Edit Modal */}
      {isCreateOpen && (
        <CreateAlarmModal
          initialAlarm={editingAlarm}
          settings={settings}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingAlarm(null);
          }}
          onSave={handleSaveAlarm}
        />
      )}

      {/* Ringing Modal (when active in foreground) */}
      {ringingAlarm && (
        <AlarmRingingModal
          alarm={ringingAlarm}
          settings={settings}
          onDismiss={handleDismissRinging}
          onSnooze={handleSnoozeRinging}
        />
      )}
    </div>
  );
}

export default App;
