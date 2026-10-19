import { useEffect } from "react";
import { AlarmSequence, AppSettings } from "../types/alarm";
import { playTonePreview, stopTonePreview } from "../services/alarmApi";
import { BellRing, Check, Clock, RotateCcw } from "lucide-react";

interface AlarmRingingModalProps {
  alarm: AlarmSequence;
  settings: AppSettings;
  onDismiss: () => void;
  onSnooze: () => void;
}

export const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({
  alarm,
  settings,
  onDismiss,
  onSnooze,
}) => {
  useEffect(() => {
    // Play looped tone until dismissed or snoozed
    playTonePreview(alarm.sound || "Aura Dawn");
    const interval = setInterval(() => {
      playTonePreview(alarm.sound || "Aura Dawn");
    }, 2500);

    return () => {
      clearInterval(interval);
      stopTonePreview();
    };
  }, [alarm.sound]);

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const formattedTime = settings.time_format === "24h"
    ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    : `${(hours % 12 || 12).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#101114] text-[#e3e2e6] p-6 select-none overflow-hidden animate-in fade-in duration-300">
      {/* Background Animated Glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-80 h-80 rounded-full bg-[#c8bfff]/20 blur-[100px] animate-pulse" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 flex flex-col items-center pt-8 space-y-2">
        <div className="w-16 h-16 rounded-full bg-[#c8bfff]/20 flex items-center justify-center text-[#c8bfff] ring-8 ring-[#c8bfff]/10 animate-bounce">
          <BellRing className="w-8 h-8" />
        </div>
        <span className="text-xs uppercase tracking-widest font-bold text-[#c8bfff] mt-2">
          iAlarm · Interval Alarm
        </span>
        <h1 className="text-2xl font-bold text-white text-center">
          {alarm.name}
        </h1>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b1b1f] border border-white/10 text-xs text-[#40e17e]">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>
            Occurrence {alarm.current_occurrence_index + 1} of {alarm.total_occurrences}
          </span>
        </div>
      </div>

      {/* Center Clock Display */}
      <div className="relative z-10 flex flex-col items-center justify-center py-10">
        <span className="text-6xl font-light tracking-tighter text-white tabular-nums drop-shadow-md">
          {formattedTime}
        </span>
        <span className="text-xs text-[#928f9d] mt-2">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Bottom Action Buttons */}
      <div className="relative z-10 flex flex-col gap-3 pb-8 max-w-sm mx-auto w-full">
        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="w-full h-16 rounded-full bg-[#c8bfff] text-[#121316] font-bold text-lg flex items-center justify-center gap-2 shadow-2xl shadow-[#c8bfff]/30 active:scale-95 transition-all hover:bg-[#a99bff]"
        >
          <Check className="w-6 h-6" />
          <span>Dismiss Occurrence</span>
        </button>

        {/* Snooze Button */}
        <button
          onClick={onSnooze}
          className="w-full h-14 rounded-full bg-[#1b1b1f] border border-white/10 text-[#e3e2e6] hover:bg-[#292a2d] font-semibold text-base flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Clock className="w-5 h-5 text-[#c8bfff]" />
          <span>Snooze ({alarm.snooze_duration_minutes || settings.default_snooze_minutes || 10}m)</span>
        </button>
      </div>
    </div>
  );
};
