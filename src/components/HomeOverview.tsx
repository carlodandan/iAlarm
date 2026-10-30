import React, { useState, useEffect } from "react";
import {
  AlarmSequence,
  AppSettings,
} from "../types/alarm";
import {
  AlarmClock,
  Plus,
  RotateCw,
  Hourglass,
  ArrowRight,
  Pill,
  Droplets,
  Dumbbell,
  Zap,
  Tag,
  Settings as SettingsIcon,
} from "lucide-react";
import intervalAlarmLogo from "../assets/interval_alarm_logo.svg";


interface HomeOverviewProps {
  alarms: AlarmSequence[];
  settings: AppSettings;
  onSelectAlarm: (alarm: AlarmSequence) => void;
  onToggleAlarm: (id: string, enabled: boolean) => void;
  onCreateNew: () => void;
  onOpenSettings: () => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  alarms,
  settings,
  onSelectAlarm,
  onToggleAlarm,
  onCreateNew,
  onOpenSettings,
}) => {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (epochMs: number) => {
    const dt = new Date(epochMs);
    const h = dt.getHours();
    const m = dt.getMinutes();
    if (settings.time_format === "24h") {
      return {
        digits: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
        period: "",
      };
    }
    const period = h >= 12 ? "PM" : "AM";
    const hours12 = h % 12 || 12;
    return {
      digits: `${hours12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
      period,
    };
  };

  const getRemainingTimeStr = (targetMs: number | null) => {
    if (!targetMs || targetMs <= now) return "Due now";
    const diffMs = targetMs - now;
    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hrs > 0) {
      return `in ${hrs}h ${mins}m`;
    }
    return `in ${mins}m`;
  };

  // Find the immediate next active alarm across all enabled sequences
  const activeAlarms = alarms.filter((a) => a.enabled && a.next_trigger_time && a.next_trigger_time > now);
  activeAlarms.sort((a, b) => (a.next_trigger_time || 0) - (b.next_trigger_time || 0));
  const heroAlarm = activeAlarms[0] || alarms.find((a) => a.enabled) || alarms[0] || null;

  const filteredAlarms = alarms.filter((a) => {
    if (filter === "active") return a.enabled && a.state !== "completed";
    if (filter === "completed") return a.state === "completed";
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "medication":
        return <Pill className="w-5 h-5" />;
      case "hydration":
        return <Droplets className="w-5 h-5" />;
      case "fitness":
        return <Dumbbell className="w-5 h-5" />;
      case "focus":
        return <Zap className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  const heroTime = heroAlarm?.next_trigger_time ? formatTime(heroAlarm.next_trigger_time) : formatTime(heroAlarm?.start_time || now);

  return (
    <div className="flex flex-col w-full min-h-screen px-4 pt-safe pb-28">
      {/* Header Bar */}
      <header className="flex items-center justify-between h-14 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#c8bfff]/10 flex items-center justify-center border border-[#c8bfff]/20 overflow-hidden">
            <img
              src={intervalAlarmLogo}
              alt="iAlarm Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-[#c8bfff] tracking-widest leading-none">
              Interval Alarm
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#e3e2e6] leading-tight">
              iAlarm
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1b1b1f] border border-white/5 text-[#c9c4d3] hover:text-[#e3e2e6] active:scale-95 transition-all"
            aria-label="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Circadian / Reliability Status Pill */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8bfff] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c8bfff]"></span>
          </span>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#c9c4d3]">
            Android AlarmManager Armed
          </span>
        </div>
        <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-[#1b1b1f] text-[#40e17e] text-[11px] font-medium border border-[#40e17e]/15">
          <Zap className="w-3.5 h-3.5" />
          <span>Native Precision</span>
        </div>
      </div>

      {/* Hero Next Alarm Card */}
      {heroAlarm ? (
        <div
          onClick={() => onSelectAlarm(heroAlarm)}
          className="relative overflow-hidden rounded-3xl bg-[#1b1b1f] p-5 mb-5 border border-white/10 shadow-2xl cursor-pointer active:scale-[0.99] transition-all"
        >
          {/* Ambient Lavender Glow */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#c8bfff]/10 blur-3xl pointer-events-none" />

          {/* Top Meta Row */}
          <div className="relative z-10 flex items-start justify-between mb-2">
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#c8bfff]/15 text-[#c8bfff] w-fit mb-1.5 border border-[#c8bfff]/25">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c8bfff] animate-pulse" />
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  Next: {getRemainingTimeStr(heroAlarm.next_trigger_time)}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-[#e3e2e6] tracking-tight">
                {heroAlarm.name}
              </h2>
            </div>

            {/* Tactile Switch */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onToggleAlarm(heroAlarm.id, !heroAlarm.enabled);
              }}
              className={`w-13 h-7 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                heroAlarm.enabled ? "bg-[#c8bfff]" : "bg-[#292a2d]"
              }`}
              style={{ width: 52, height: 30 }}
            >
              <div
                className={`w-6 h-6 rounded-full transition-transform transform shadow-sm ${
                  heroAlarm.enabled
                    ? "translate-x-5 bg-[#2f1d7d]"
                    : "translate-x-0.5 bg-[#928f9d]"
                }`}
              />
            </div>
          </div>

          {/* Big Clock Display */}
          <div className="relative z-10 flex items-baseline gap-2 mb-3">
            <span className="text-5xl font-light tracking-tighter text-[#e3e2e6] tabular-nums">
              {heroTime.digits}
            </span>
            {heroTime.period && (
              <span className="text-xl font-medium text-[#c8bfff]">
                {heroTime.period}
              </span>
            )}
          </div>

          {/* Cadence Pills */}
          <div className="relative z-10 flex items-center gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#292a2d] text-[#e3e2e6] text-xs font-medium">
              <RotateCw className="w-3.5 h-3.5 text-[#c8bfff]" />
              <span>
                Every {heroAlarm.interval_value}{" "}
                {heroAlarm.interval_unit === "hours" ? "h" : "m"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#292a2d] text-[#c9c4d3] text-xs">
              <Hourglass className="w-3.5 h-3.5" />
              <span>
                {Math.max(0, heroAlarm.total_occurrences - heroAlarm.current_occurrence_index)} cycles remain
              </span>
            </div>
          </div>

          {/* Mini Ladder Trail */}
          <div className="relative z-10 p-2.5 rounded-2xl bg-[#0d0e11]/90 border border-white/5 flex items-center justify-between gap-1 overflow-x-auto text-xs tabular-nums">
            {Array.from({ length: Math.min(4, heroAlarm.total_occurrences) }).map((_, idx) => {
              const occTime =
                heroAlarm.start_time +
                idx * (heroAlarm.interval_unit === "hours" ? heroAlarm.interval_value * 3600000 : heroAlarm.interval_value * 60000);
              const formatted = formatTime(occTime);
              const isPast = idx < heroAlarm.current_occurrence_index;
              const isCurrent = idx === heroAlarm.current_occurrence_index;

              return (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCurrent
                          ? "bg-[#40e17e] animate-pulse"
                          : isPast
                          ? "bg-[#c8bfff]"
                          : "bg-[#484552]"
                      }`}
                    />
                    <span
                      className={`${
                        isCurrent
                          ? "text-[#40e17e] font-semibold"
                          : isPast
                          ? "text-[#c9c4d3] line-through"
                          : "text-[#928f9d]"
                      }`}
                    >
                      {formatted.digits} {formatted.period}
                    </span>
                  </div>
                  {idx < Math.min(4, heroAlarm.total_occurrences) - 1 && (
                    <ArrowRight className="w-3 h-3 text-[#484552] shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-[#1b1b1f] border border-white/5 text-center mb-5">
          <AlarmClock className="w-12 h-12 text-[#c8bfff] mx-auto mb-3 opacity-60" />
          <h2 className="text-lg font-semibold text-[#e3e2e6] mb-1">No Active Sequences</h2>
          <p className="text-sm text-[#c9c4d3] mb-4">
            Create an interval sequence to schedule fixed-interval alarms automatically.
          </p>
          <button
            onClick={onCreateNew}
            className="px-5 py-2.5 rounded-full bg-[#c8bfff] text-[#121316] font-semibold text-sm shadow-md active:scale-95"
          >
            Create First Alarm
          </button>
        </div>
      )}

      {/* Segmented Filter Bar */}
      <div className="flex items-center p-1 rounded-2xl bg-[#1b1b1f] mb-4 border border-white/5">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all ${
            filter === "all"
              ? "bg-[#292a2d] text-[#e3e2e6] shadow-sm"
              : "text-[#c9c4d3] hover:text-[#e3e2e6]"
          }`}
        >
          All <span className="text-[#c8bfff] ml-1">{alarms.length}</span>
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all ${
            filter === "active"
              ? "bg-[#292a2d] text-[#e3e2e6] shadow-sm"
              : "text-[#c9c4d3] hover:text-[#e3e2e6]"
          }`}
        >
          Active{" "}
          <span className="text-[#40e17e] ml-1">
            {alarms.filter((a) => a.enabled && a.state !== "completed").length}
          </span>
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all ${
            filter === "completed"
              ? "bg-[#292a2d] text-[#e3e2e6] shadow-sm"
              : "text-[#c9c4d3] hover:text-[#e3e2e6]"
          }`}
        >
          Completed{" "}
          <span className="text-[#928f9d] ml-1">
            {alarms.filter((a) => a.state === "completed").length}
          </span>
        </button>
      </div>

      {/* Alarms Stack */}
      <div className="flex flex-col gap-3">
        {filteredAlarms.map((alarm) => {
          const alarmTime = alarm.next_trigger_time
            ? formatTime(alarm.next_trigger_time)
            : formatTime(alarm.start_time);
          const remainingOccurrences = Math.max(
            0,
            alarm.total_occurrences - alarm.current_occurrence_index
          );

          return (
            <div
              key={alarm.id}
              onClick={() => onSelectAlarm(alarm)}
              className="relative overflow-hidden rounded-2xl bg-[#1f1f23] p-4 border border-white/5 hover:border-white/10 transition-all cursor-pointer active:scale-[0.99] shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#c8bfff]/10 flex items-center justify-center text-[#c8bfff] shrink-0 border border-[#c8bfff]/20">
                    {getCategoryIcon(alarm.category)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-base font-semibold text-[#e3e2e6] truncate">
                      {alarm.name}
                    </h3>
                    <span className="text-xs text-[#c9c4d3]">
                      {alarm.repetition_mode === "daily"
                        ? "Daily sequence"
                        : alarm.repetition_mode === "weekdays"
                        ? "Weekdays (Mon - Fri)"
                        : alarm.repetition_mode === "continuous"
                        ? "Continuous cycles"
                        : "One-time sequence"}
                    </span>
                  </div>
                </div>

                {/* Tactile Switch */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAlarm(alarm.id, !alarm.enabled);
                  }}
                  className={`w-13 h-7 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center ${
                    alarm.enabled ? "bg-[#c8bfff]" : "bg-[#292a2d]"
                  }`}
                  style={{ width: 50, height: 28 }}
                >
                  <div
                    className={`w-5.5 h-5.5 rounded-full transition-transform transform shadow-sm ${
                      alarm.enabled
                        ? "translate-x-5 bg-[#2f1d7d]"
                        : "translate-x-0.5 bg-[#928f9d]"
                    }`}
                  />
                </div>
              </div>

              {/* Center Time & Metadata */}
              <div className="flex items-baseline justify-between mb-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-light tracking-tight text-[#e3e2e6] tabular-nums">
                    {alarmTime.digits}
                  </span>
                  {alarmTime.period && (
                    <span className="text-sm font-medium text-[#c9c4d3]">
                      {alarmTime.period}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold text-[#c8bfff] tabular-nums">
                    {alarm.enabled ? getRemainingTimeStr(alarm.next_trigger_time) : "Disabled"}
                  </span>
                  <span className="text-xs text-[#928f9d]">
                    Interval: {alarm.interval_value}
                    {alarm.interval_unit === "hours" ? "h" : "m"} step
                  </span>
                </div>
              </div>

              {/* Occurrence Stepper Dots */}
              <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(10, alarm.total_occurrences) }).map((_, dotIdx) => {
                    const isDone = dotIdx < alarm.current_occurrence_index;
                    const isNext = dotIdx === alarm.current_occurrence_index;
                    return (
                      <span
                        key={dotIdx}
                        className={`w-2 h-2 rounded-full transition-all ${
                          isDone
                            ? "bg-[#c8bfff]"
                            : isNext && alarm.enabled
                            ? "bg-[#40e17e] ring-2 ring-[#40e17e]/30 scale-125"
                            : "bg-[#343538]"
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[11px] uppercase tracking-wider text-[#c9c4d3] font-medium">
                  {remainingOccurrences} of {alarm.total_occurrences} Remaining
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={onCreateNew}
          className="w-14 h-14 rounded-full bg-[#c8bfff] text-[#121316] flex items-center justify-center shadow-lg shadow-[#c8bfff]/25 active:scale-95 transition-all hover:bg-[#a99bff]"
          aria-label="Create new interval alarm"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
