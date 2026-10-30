import React, { useState } from "react";
import { AppSettings, NativePermissionStatus } from "../types/alarm";
import { AlarmApi, CustomRingtones, LegacyPresets, playTonePreview, stopTonePreview } from "../services/alarmApi";
import {
  ShieldCheck,
  Zap,
  Bell,
  ExternalLink,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Download,
  Upload,
  ArrowLeft,
} from "lucide-react";


interface SettingsViewProps {
  settings: AppSettings;
  permissions: NativePermissionStatus;
  onUpdateSettings: (newSettings: AppSettings) => Promise<void>;
  onClose: () => void;
  onExport: () => void;
  onImport: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  permissions,
  onUpdateSettings,
  onClose,
  onExport,
  onImport,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleThemeChange = async (theme: "system" | "dark" | "light") => {
    await onUpdateSettings({ ...settings, display_theme: theme });
  };

  const handleTimeFormatChange = async (format: "12h" | "24h") => {
    await onUpdateSettings({ ...settings, time_format: format });
  };

  const handleToggleVibration = async () => {
    await onUpdateSettings({ ...settings, default_vibration: !settings.default_vibration });
  };

  const handleToggleGradual = async () => {
    await onUpdateSettings({
      ...settings,
      default_gradual_volume: !settings.default_gradual_volume,
    });
  };

  const handleSnoozeChange = async (mins: number) => {
    await onUpdateSettings({ ...settings, default_snooze_minutes: mins });
  };

  const handleSoundChange = async (snd: string) => {
    await onUpdateSettings({ ...settings, default_sound: snd });
  };

  const handleTestAudio = () => {
    if (isPlayingAudio) {
      stopTonePreview();
      setIsPlayingAudio(false);
    } else {
      playTonePreview(settings.default_sound || "Aura Dawn");
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 2500);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen px-4 pt-safe pb-28 text-[#e3e2e6]">
      {/* Header Bar */}
      <header className="flex items-center justify-between h-14 mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1b1b1f] border border-white/5 text-[#e3e2e6] active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-[#c8bfff] tracking-widest leading-none">
              Interval Alarm
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#e3e2e6] leading-tight">
              iAlarm Settings
            </h1>
          </div>
        </div>
      </header>

      <div className="space-y-4 max-w-lg mx-auto w-full">
        {/* Reliability System Health Banner */}
        <section className="bg-[#1b1b1f] rounded-2xl p-4 border border-white/5 space-y-3 relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-[#c8bfff]/5 pointer-events-none blur-xl" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#40e17e]/15 text-[#40e17e] flex items-center justify-center border border-[#40e17e]/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#40e17e] tracking-widest block">
                  System Diagnostics
                </span>
                <h2 className="text-base font-bold text-[#e3e2e6]">Precision Status</h2>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#40e17e]/15 text-[#40e17e] text-[10px] font-semibold uppercase tracking-wider border border-[#40e17e]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#40e17e] animate-pulse" />
              Reliable
            </span>
          </div>

          <p className="text-xs text-[#c9c4d3]">
            Alarms are orchestrated through native Android <code className="text-[#c8bfff] font-mono">AlarmManager</code> with wake-lock persistence for atomic ring execution even when the screen is locked or the app process is terminated.
          </p>

          {/* Permissions Micro-List */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#292a2d] border border-white/5 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#40e17e]" />
                <span className="font-medium text-[#e3e2e6]">Exact Alarms &amp; Reminders</span>
              </div>
              <button
                type="button"
                onClick={() => AlarmApi.openAppSettings("exact_alarm")}
                className={`text-[10px] uppercase font-semibold px-2.5 py-1 rounded-full transition-all ${
                  permissions.exact_alarm_granted
                    ? "text-[#40e17e] bg-[#40e17e]/15"
                    : "text-[#c8bfff] bg-[#c8bfff]/20 hover:bg-[#c8bfff]/30 border border-[#c8bfff]/30"
                }`}
              >
                {permissions.exact_alarm_granted ? "Allowed" : "Tap to Allow"}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#292a2d] border border-white/5 text-xs">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#40e17e]" />
                <span className="font-medium text-[#e3e2e6]">Notifications (Lockscreen &amp; Ringing)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  AlarmApi.requestNotificationPermission();
                  AlarmApi.openAppSettings("notifications");
                }}
                className={`text-[10px] uppercase font-semibold px-2.5 py-1 rounded-full transition-all ${
                  permissions.notifications_granted
                    ? "text-[#40e17e] bg-[#40e17e]/15"
                    : "text-[#ff5c5c] bg-[#ff5c5c]/20 hover:bg-[#ff5c5c]/30 border border-[#ff5c5c]/30"
                }`}
              >
                {permissions.notifications_granted ? "Allowed" : "Grant Access"}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#292a2d] border border-white/5 text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#40e17e]" />
                <span className="font-medium text-[#e3e2e6]">Battery Optimization</span>
              </div>
              <button
                type="button"
                onClick={() => AlarmApi.openAppSettings("battery")}
                className="text-[10px] uppercase font-semibold text-[#40e17e] bg-[#40e17e]/15 px-2 py-0.5 rounded-full"
              >
                {permissions.battery_optimization_unrestricted ? "Unrestricted" : "Optimized"}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => AlarmApi.openAppSettings("app_details")}
              className="h-11 flex items-center justify-center gap-2 rounded-xl bg-[#c8bfff] text-[#121316] text-xs font-bold active:scale-[0.98] transition-all shadow-sm"
            >
              <span>Open App Info &amp; Permissions</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => AlarmApi.openAppSettings("exact_alarm")}
              className="h-11 flex items-center justify-center gap-2 rounded-xl bg-[#292a2d] hover:bg-[#343538] text-[#e3e2e6] text-xs font-semibold active:scale-[0.98] transition-all border border-white/5"
            >
              <span>Alarms &amp; Reminders Setting</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#c8bfff]" />
            </button>
          </div>
        </section>

        {/* Appearance Group */}
        <section className="bg-[#1b1b1f] rounded-2xl p-4 border border-white/5 space-y-4">
          <span className="text-[10px] uppercase font-semibold text-[#c8bfff] tracking-widest block">
            Interface &amp; Visuals
          </span>

          {/* Theme Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#e3e2e6]">Display Theme</span>
              <span className="text-[#928f9d] capitalize">{settings.display_theme}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#1f1f23] border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => handleThemeChange("system")}
                className={`h-9 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  settings.display_theme === "system"
                    ? "bg-[#c8bfff] text-[#121316] shadow-sm"
                    : "text-[#c9c4d3]"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`h-9 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  settings.display_theme === "dark"
                    ? "bg-[#c8bfff] text-[#121316] shadow-sm"
                    : "text-[#c9c4d3]"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`h-9 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  settings.display_theme === "light"
                    ? "bg-[#c8bfff] text-[#121316] shadow-sm"
                    : "text-[#c9c4d3]"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
            </div>
          </div>

          {/* Time Format */}
          <div className="space-y-2 pt-1 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#e3e2e6]">Time Standard</span>
              <span className="text-[#928f9d]">Circadian</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#1f1f23] border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => handleTimeFormatChange("12h")}
                className={`h-9 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  settings.time_format === "12h"
                    ? "bg-[#c8bfff] text-[#121316] shadow-sm"
                    : "text-[#c9c4d3]"
                }`}
              >
                <span>12-Hour</span>
                <span className="text-[10px] opacity-75">(09:41 AM)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTimeFormatChange("24h")}
                className={`h-9 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  settings.time_format === "24h"
                    ? "bg-[#c8bfff] text-[#121316] shadow-sm"
                    : "text-[#c9c4d3]"
                }`}
              >
                <span>24-Hour</span>
                <span className="text-[10px] opacity-75">(21:41)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Default Alarm Behaviors */}
        <section className="bg-[#1b1b1f] rounded-2xl p-4 border border-white/5 space-y-3">
          <span className="text-[10px] uppercase font-semibold text-[#c8bfff] tracking-widest block">
            Alarm Defaults
          </span>

          <div className="divide-y divide-white/5 space-y-3">
            {/* Snooze Span */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#e3e2e6]">Default Snooze Span</span>
                <span className="text-xs text-[#928f9d]">Duration between repeating alerts</span>
              </div>
              <select
                value={settings.default_snooze_minutes}
                onChange={(e) => handleSnoozeChange(parseInt(e.target.value))}
                className="bg-[#292a2d] px-3 py-1.5 rounded-xl text-xs font-semibold text-[#c8bfff] outline-none cursor-pointer border border-white/5"
              >
                <option value={5} className="bg-[#1f1f23]">5 min</option>
                <option value={10} className="bg-[#1f1f23]">10 min</option>
                <option value={15} className="bg-[#1f1f23]">15 min</option>
                <option value={20} className="bg-[#1f1f23]">20 min</option>
              </select>
            </div>

            {/* Vibration */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex flex-col pr-4">
                <span className="text-sm font-medium text-[#e3e2e6]">Haptic Vibration</span>
                <span className="text-xs text-[#928f9d]">Sync motor vibration pulses with chimes</span>
              </div>
              <div
                onClick={handleToggleVibration}
                className={`w-13 h-7 rounded-full p-0.5 transition-colors cursor-pointer flex items-center shrink-0 ${
                  settings.default_vibration ? "bg-[#c8bfff]" : "bg-[#292a2d]"
                }`}
                style={{ width: 50, height: 28 }}
              >
                <div
                  className={`w-5.5 h-5.5 rounded-full transition-transform transform shadow-sm ${
                    settings.default_vibration
                      ? "translate-x-5 bg-[#2f1d7d]"
                      : "translate-x-0.5 bg-[#928f9d]"
                  }`}
                />
              </div>
            </div>

            {/* Gradual Volume Ramp */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex flex-col pr-4">
                <span className="text-sm font-medium text-[#e3e2e6]">Gentle Volume Ramp</span>
                <span className="text-xs text-[#928f9d]">Gradually scale up amplitude over 30s</span>
              </div>
              <div
                onClick={handleToggleGradual}
                className={`w-13 h-7 rounded-full p-0.5 transition-colors cursor-pointer flex items-center shrink-0 ${
                  settings.default_gradual_volume ? "bg-[#c8bfff]" : "bg-[#292a2d]"
                }`}
                style={{ width: 50, height: 28 }}
              >
                <div
                  className={`w-5.5 h-5.5 rounded-full transition-transform transform shadow-sm ${
                    settings.default_gradual_volume
                      ? "translate-x-5 bg-[#2f1d7d]"
                      : "translate-x-0.5 bg-[#928f9d]"
                  }`}
                />
              </div>
            </div>

            {/* Master Ringtone Preview */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-sm font-medium text-[#e3e2e6]">Master Ringtone</span>
                <select
                  value={settings.default_sound}
                  onChange={(e) => handleSoundChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#c8bfff] outline-none cursor-pointer mt-0.5"
                >
                  <optgroup label="Custom Ringtones" className="bg-[#1b1b1f] text-[#c8bfff] font-bold">
                    {CustomRingtones.map((sp) => (
                      <option key={sp.id} value={sp.id} className="bg-[#1f1f23] text-[#e3e2e6] font-normal">
                        {sp.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Ambient Presets" className="bg-[#1b1b1f] text-[#928f9d] font-bold">
                    {LegacyPresets.map((sp) => (
                      <option key={sp.id} value={sp.id} className="bg-[#1f1f23] text-[#e3e2e6] font-normal">
                        {sp.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <button
                onClick={handleTestAudio}
                className="w-9 h-9 rounded-full bg-[#292a2d] hover:bg-[#c8bfff] text-[#e3e2e6] hover:text-[#121316] flex items-center justify-center transition-all active:scale-90"
              >
                {isPlayingAudio ? (
                  <VolumeX className="w-4 h-4 text-[#ff5c5c]" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Backup & Data Management */}
        <section className="bg-[#1b1b1f] rounded-2xl p-4 border border-white/5 space-y-3">
          <span className="text-[10px] uppercase font-semibold text-[#c8bfff] tracking-widest block">
            Data Management
          </span>
          <div className="space-y-2">
            <button
              onClick={onExport}
              className="w-full h-11 flex items-center justify-between px-4 rounded-xl bg-[#292a2d] hover:bg-[#343538] text-[#e3e2e6] text-xs font-semibold transition-all active:scale-[0.99] border border-white/5"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-[#c8bfff]" />
                <span>Export Sequences (JSON)</span>
              </div>
              <span className="text-[10px] text-[#928f9d]">Schema v2</span>
            </button>
            <button
              onClick={onImport}
              className="w-full h-11 flex items-center justify-between px-4 rounded-xl bg-[#292a2d] hover:bg-[#343538] text-[#e3e2e6] text-xs font-semibold transition-all active:scale-[0.99] border border-white/5"
            >
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#40e17e]" />
                <span>Restore / Import Profiles</span>
              </div>
              <span className="text-[10px] text-[#928f9d]">Offline</span>
            </button>
          </div>
        </section>

        {/* About Card */}
        <div className="p-4 rounded-2xl bg-[#1b1b1f]/50 border border-white/5 text-center text-xs text-[#928f9d] space-y-1.5">
          <p className="font-bold text-sm text-[#e3e2e6]">iAlarm <span className="text-xs text-[#c8bfff] font-normal">(Interval Alarm)</span> · v0.1.0</p>
          <p className="font-mono text-[11px] text-[#928f9d]">App Identifier: <span className="text-[#c8bfff]">com.intervalalarm.alarm</span></p>
          <p className="text-[11px]">Android-first offline utility with native AlarmManager &amp; WakeLock architecture.</p>
        </div>
      </div>
    </div>
  );
};
