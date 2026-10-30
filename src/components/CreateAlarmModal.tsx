import React, { useState, useEffect, useRef } from "react";
import {
  AlarmSequence,
  AppSettings,
  CreateAlarmPayload,
  DeviceRingtone,
  IntervalUnit,
  RepetitionMode,
  SchedulePreviewItem,
} from "../types/alarm";
import { AlarmApi, CustomRingtones, LegacyPresets, playTonePreview, stopTonePreview } from "../services/alarmApi";
import {
  X,
  Check,
  Tag,
  Pill,
  Droplets,
  Dumbbell,
  Zap,
  Calendar,
  Clock,
  Plus,
  Minus,
  Infinity as InfinityIcon,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Vibrate,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface CreateAlarmModalProps {
  initialAlarm?: AlarmSequence | null;
  settings: AppSettings;
  onClose: () => void;
  onSave: (payload: CreateAlarmPayload) => Promise<void>;
}

export const CreateAlarmModal: React.FC<CreateAlarmModalProps> = ({
  initialAlarm,
  settings,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialAlarm?.name || "Hydration & Posture Interval");
  const [category, setCategory] = useState(initialAlarm?.category || "hydration");
  const [startHour, setStartHour] = useState(() => {
    if (initialAlarm) {
      const dt = new Date(initialAlarm.start_time);
      const h = dt.getHours();
      return settings.time_format === "24h" ? h : h % 12 || 12;
    }
    return 6;
  });
  const [startMinute, setStartMinute] = useState(() => {
    if (initialAlarm) {
      return new Date(initialAlarm.start_time).getMinutes();
    }
    return 0;
  });
  const [isPM, setIsPM] = useState(() => {
    if (initialAlarm) {
      return new Date(initialAlarm.start_time).getHours() >= 12;
    }
    return false;
  });
  const [intervalValue, setIntervalValue] = useState(initialAlarm?.interval_value || 6);
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>(initialAlarm?.interval_unit || "hours");
  const [occurrences, setOccurrences] = useState(initialAlarm?.total_occurrences || 4);
  const [isContinuous, setIsContinuous] = useState(initialAlarm?.repetition_mode === "continuous");
  const [repetitionMode, setRepetitionMode] = useState<RepetitionMode>(initialAlarm?.repetition_mode || "one_time");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(
    initialAlarm?.selected_weekdays?.length ? initialAlarm.selected_weekdays : [1, 2, 3, 4, 5]
  );
  const [sound, setSound] = useState(initialAlarm?.sound || "Device Default");
  const [deviceRingtone, setDeviceRingtone] = useState<DeviceRingtone>({
    title: "System Default Alarm Tone",
    uri: "",
  });
  const [vibration, setVibration] = useState(initialAlarm?.vibration ?? settings.default_vibration ?? true);
  const [snoozeMinutes, setSnoozeMinutes] = useState(initialAlarm?.snooze_duration_minutes || settings.default_snooze_minutes || 10);
  const [gradualVolume, setGradualVolume] = useState(initialAlarm?.gradual_volume ?? settings.default_gradual_volume ?? true);
  const [isCadenceOpen, setIsCadenceOpen] = useState(false);
  const [previewItems, setPreviewItems] = useState<SchedulePreviewItem[]>([]);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    AlarmApi.getDeviceRingtone().then((dr) => {
      if (dr && dr.title) {
        setDeviceRingtone(dr);
        if (!initialAlarm) {
          setSound(`Device Default: ${dr.title}`);
        }
      }
    });
  }, [initialAlarm]);

  // Compute calculated anchor start timestamp
  const calculateStartTimeMs = () => {
    const now = new Date();
    let hours24 = startHour;
    if (settings.time_format !== "24h") {
      if (isPM && startHour < 12) hours24 += 12;
      if (!isPM && startHour === 12) hours24 = 0;
    }
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours24, startMinute, 0, 0);
    // If targeted time is earlier than now, set to tomorrow
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target.getTime();
  };

  // Re-fetch preview whenever schedule parameters change
  useEffect(() => {
    const startMs = calculateStartTimeMs();
    AlarmApi.previewSchedule(
      startMs,
      intervalValue,
      intervalUnit,
      occurrences,
      settings.time_format === "24h"
    ).then((items) => setPreviewItems(items));
  }, [startHour, startMinute, isPM, intervalValue, intervalUnit, occurrences, settings.time_format]);

  // Clean up audio preview on unmount
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      stopTonePreview();
    };
  }, []);

  const handleToggleSoundPreview = () => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    if (isPlayingPreview) {
      stopTonePreview();
      setIsPlayingPreview(false);
    } else {
      playTonePreview(sound);
      setIsPlayingPreview(true);
      previewTimerRef.current = setTimeout(() => {
        stopTonePreview();
        setIsPlayingPreview(false);
      }, 3500);
    }
  };

  const handleQuickPreset = (type: "now" | "top" | "tomorrow7a") => {
    const now = new Date();
    if (type === "now") {
      const future = new Date(now.getTime() + 5 * 60 * 1000);
      const h = future.getHours();
      const m = future.getMinutes();
      setStartHour(settings.time_format === "24h" ? h : h % 12 || 12);
      setStartMinute(m);
      setIsPM(h >= 12);
    } else if (type === "top") {
      const top = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
      const h = top.getHours();
      setStartHour(settings.time_format === "24h" ? h : h % 12 || 12);
      setStartMinute(0);
      setIsPM(h >= 12);
    } else if (type === "tomorrow7a") {
      setStartHour(7);
      setStartMinute(0);
      setIsPM(false);
    }
  };

  const toggleWeekday = (day: number) => {
    if (selectedWeekdays.includes(day)) {
      if (selectedWeekdays.length > 1) {
        setSelectedWeekdays(selectedWeekdays.filter((d) => d !== day));
      }
    } else {
      setSelectedWeekdays([...selectedWeekdays, day].sort());
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const startMs = calculateStartTimeMs();
      const repMode = isContinuous
        ? "continuous"
        : repetitionMode === "weekdays"
        ? "weekdays"
        : repetitionMode === "daily"
        ? "daily"
        : "one_time";

      await onSave({
        name: name.trim() || "Interval Alarm",
        category,
        start_time: startMs,
        interval_value: Math.max(1, intervalValue),
        interval_unit: intervalUnit,
        total_occurrences: Math.max(1, occurrences),
        repetition_mode: repMode,
        selected_weekdays: selectedWeekdays,
        sound,
        vibration,
        snooze_duration_minutes: snoozeMinutes,
        snooze_max_count: 3,
        gradual_volume: gradualVolume,
      });
      onClose();
    } catch (e) {
      alert("Failed to save alarm: " + e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: "medication", label: "Meds", icon: <Pill className="w-3.5 h-3.5" /> },
    { id: "hydration", label: "Hydration", icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: "fitness", label: "Fitness", icon: <Dumbbell className="w-3.5 h-3.5" /> },
    { id: "focus", label: "Focus", icon: <Zap className="w-3.5 h-3.5" /> },
    { id: "custom", label: "Custom", icon: <Tag className="w-3.5 h-3.5" /> },
  ];

  const weekdayLabels = [
    { day: 1, label: "M" },
    { day: 2, label: "T" },
    { day: 3, label: "W" },
    { day: 4, label: "T" },
    { day: 5, label: "F" },
    { day: 6, label: "S" },
    { day: 7, label: "S" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#121316] text-[#e3e2e6] overflow-y-auto">
      {/* Top Modal Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#121316]/90 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1b1b1f] border border-white/5 text-[#e3e2e6] active:scale-90 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold text-[#e3e2e6]">
            {initialAlarm ? "Edit Interval" : "New Interval"}
          </span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-1.5 rounded-full bg-[#c8bfff] text-[#121316] text-xs font-semibold active:scale-95 transition-all flex items-center gap-1 shadow-md shadow-[#c8bfff]/20 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{isSubmitting ? "Saving..." : "Save"}</span>
        </button>
      </div>

      <div className="flex flex-col px-4 pt-2 pb-24 space-y-4 max-w-lg mx-auto w-full">
        {/* Section 1: Alarm Identity */}
        <div className="bg-[#1b1b1f] p-4 rounded-2xl border border-white/5 space-y-3">
          <div className="flex items-center gap-2.5 bg-[#1f1f23] px-3.5 py-2.5 rounded-xl border border-white/5">
            <Tag className="w-5 h-5 text-[#c8bfff] shrink-0" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Interval sequence name..."
              className="bg-transparent border-0 outline-none w-full text-[#e3e2e6] text-sm font-medium placeholder:text-[#928f9d]"
            />
            {name && (
              <button
                type="button"
                onClick={() => setName("")}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[#928f9d] hover:text-[#e3e2e6]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 active:scale-95 transition-all ${
                  category === c.id
                    ? "bg-[#c8bfff] text-[#121316] shadow-sm shadow-[#c8bfff]/25"
                    : "bg-[#1f1f23] text-[#c9c4d3] border border-white/5"
                }`}
              >
                {c.icon}
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Starting Time Selector */}
        <div className="bg-[#1b1b1f] p-4 rounded-2xl border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#928f9d]">
              Anchor Origin
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[#c9c4d3]">
              <Calendar className="w-3.5 h-3.5 text-[#c8bfff]" />
              <span>Starts at first schedule</span>
            </div>
          </div>

          {/* Big Time Card Display */}
          <div className="flex items-center justify-between bg-[#1f1f23] p-4 rounded-2xl border border-white/5">
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                min={settings.time_format === "24h" ? 0 : 1}
                max={settings.time_format === "24h" ? 23 : 12}
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value) || 0)}
                className="w-16 bg-transparent text-5xl font-light text-[#c8bfff] tracking-tight tabular-nums outline-none"
              />
              <span className="text-5xl font-light text-[#c8bfff]/50">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={startMinute.toString().padStart(2, "0")}
                onChange={(e) => setStartMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-16 bg-transparent text-5xl font-light text-[#c8bfff] tracking-tight tabular-nums outline-none ml-1"
              />
            </div>

            {/* AM / PM Segmented Switch */}
            {settings.time_format !== "24h" && (
              <div className="flex flex-col gap-1 bg-[#292a2d] p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setIsPM(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    !isPM ? "bg-[#c8bfff] text-[#121316] shadow-sm" : "text-[#c9c4d3]"
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setIsPM(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isPM ? "bg-[#c8bfff] text-[#121316] shadow-sm" : "text-[#c9c4d3]"
                  }`}
                >
                  PM
                </button>
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset("now")}
              className="py-2 px-1 text-center bg-[#1f1f23] hover:bg-[#292a2d] active:scale-95 rounded-xl text-xs font-medium text-[#c9c4d3] border border-white/5 transition-all"
            >
              Now (+5m)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset("top")}
              className="py-2 px-1 text-center bg-[#1f1f23] hover:bg-[#292a2d] active:scale-95 rounded-xl text-xs font-medium text-[#c9c4d3] border border-white/5 transition-all"
            >
              Top of Hour
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset("tomorrow7a")}
              className="py-2 px-1 text-center bg-[#1f1f23] hover:bg-[#292a2d] active:scale-95 rounded-xl text-xs font-medium text-[#c9c4d3] border border-white/5 transition-all"
            >
              Tomorrow 7A
            </button>
          </div>
        </div>

        {/* Section 3: Interval Configuration (Core) */}
        <div className="bg-[#1b1b1f] p-4 rounded-2xl border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-[#c8bfff]" />
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#928f9d]">
                Interval Spacing
              </span>
            </div>
            {/* Unit Segment */}
            <div className="flex bg-[#292a2d] rounded-full p-0.5 border border-white/5">
              <button
                type="button"
                onClick={() => setIntervalUnit("minutes")}
                className={`px-3 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                  intervalUnit === "minutes"
                    ? "bg-[#c8bfff] text-[#121316]"
                    : "text-[#c9c4d3]"
                }`}
              >
                MINUTES
              </button>
              <button
                type="button"
                onClick={() => setIntervalUnit("hours")}
                className={`px-3 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                  intervalUnit === "hours"
                    ? "bg-[#c8bfff] text-[#121316]"
                    : "text-[#c9c4d3]"
                }`}
              >
                HOURS
              </button>
            </div>
          </div>

          {/* Stepper Display */}
          <div className="flex items-center justify-between bg-[#1f1f23] px-6 py-3 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => setIntervalValue(Math.max(1, intervalValue - 1))}
              className="w-11 h-11 rounded-full bg-[#292a2d] flex items-center justify-center active:scale-90 text-[#e3e2e6] hover:bg-[#343538] transition-all"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-semibold text-[#e3e2e6] tabular-nums">
                  {intervalValue}
                </span>
                <span className="text-sm text-[#928f9d] capitalize">
                  {intervalUnit}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#c9c4d3]">
                Every cadence
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIntervalValue(intervalValue + 1)}
              className="w-11 h-11 rounded-full bg-[#292a2d] flex items-center justify-center active:scale-90 text-[#e3e2e6] hover:bg-[#343538] transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Interval Preset Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { val: 30, unit: "minutes", label: "30m" },
              { val: 1, unit: "hours", label: "1h" },
              { val: 2, unit: "hours", label: "2h" },
              { val: 4, unit: "hours", label: "4h" },
              { val: 6, unit: "hours", label: "6h" },
              { val: 8, unit: "hours", label: "8h" },
              { val: 12, unit: "hours", label: "12h" },
            ].map((p, pIdx) => {
              const isSelected = intervalValue === p.val && intervalUnit === p.unit;
              return (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    setIntervalValue(p.val);
                    setIntervalUnit(p.unit as IntervalUnit);
                  }}
                  className={`px-3 py-1.5 rounded-full font-medium shrink-0 active:scale-95 transition-all ${
                    isSelected
                      ? "bg-[#c8bfff] text-[#121316] shadow-sm font-semibold"
                      : "bg-[#1f1f23] text-[#c9c4d3] border border-white/5"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Occurrences Count */}
        <div className="bg-[#1b1b1f] p-4 rounded-2xl border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#928f9d]">
              Repetitions
            </span>
            <span className="text-xs text-[#c8bfff] font-medium">
              Sequence Limit
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#1f1f23] px-4 py-3 rounded-2xl border border-white/5">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#e3e2e6]">Total Occurrences</span>
              <span className="text-xs text-[#c9c4d3]">
                Start + {Math.max(0, occurrences - 1)} subsequent
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOccurrences(Math.max(1, occurrences - 1))}
                className="w-9 h-9 rounded-full bg-[#292a2d] flex items-center justify-center active:scale-90 text-[#e3e2e6]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xl font-bold text-[#c8bfff] w-7 text-center tabular-nums">
                {occurrences}
              </span>
              <button
                type="button"
                onClick={() => setOccurrences(occurrences + 1)}
                className="w-9 h-9 rounded-full bg-[#292a2d] flex items-center justify-center active:scale-90 text-[#e3e2e6]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Continuous Toggle */}
          <div className="flex items-center justify-between pt-1 px-1">
            <div className="flex items-center gap-2">
              <InfinityIcon className="w-4 h-4 text-[#928f9d]" />
              <span className="text-xs font-medium text-[#e3e2e6]">Continuous Cycle</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isContinuous}
                onChange={(e) => setIsContinuous(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#292a2d] peer-focus:outline-none rounded-full peer peer-checked:bg-[#c8bfff] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#928f9d] peer-checked:after:bg-[#121316] peer-checked:after:translate-x-5 after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
        </div>

        {/* Section 5: Live Dynamic Schedule Preview */}
        <div className="bg-[#1f1f23] p-4 rounded-2xl border border-white/5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#c8bfff]" />
              <span className="text-base font-semibold text-[#e3e2e6] tracking-tight">
                Live Schedule Preview
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#c8bfff]/10 text-[#c8bfff] text-[10px] font-semibold uppercase tracking-wider border border-[#c8bfff]/20">
              Calculated
            </span>
          </div>

          {/* Timeline Tree */}
          <div className="relative flex flex-col pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-[#c8bfff] before:via-[#c8bfff]/40 before:to-[#343538]">
            {previewItems.map((item, idx) => (
              <div key={idx} className="relative flex items-center justify-between text-xs">
                <div
                  className={`absolute -left-[17px] rounded-full ring-4 ring-[#1f1f23] ${
                    idx === 0
                      ? "w-3.5 h-3.5 bg-[#c8bfff]"
                      : "w-2.5 h-2.5 bg-[#928f9d]"
                  }`}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold tabular-nums ${
                        idx === 0 ? "text-[#c8bfff] text-sm" : "text-[#e3e2e6]"
                      }`}
                    >
                      {item.formatted_time}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#292a2d] text-[#c9c4d3] text-[10px] font-medium">
                      {item.day_offset_label}
                    </span>
                  </div>
                  <span className="text-[#928f9d] text-[11px]">
                    {item.label}
                  </span>
                </div>
                <span className="text-[#c8bfff] text-xs">
                  {idx === 0 ? "Initial" : `Step ${idx + 1}`}
                </span>
              </div>
            ))}
          </div>

          {/* Sequence Duration Summary */}
          <div className="flex items-center justify-between bg-[#292a2d]/60 px-3 py-2 rounded-xl text-xs text-[#c9c4d3]">
            <span>Total sequence duration</span>
            <span className="text-[#c8bfff] font-semibold tabular-nums">
              {intervalUnit === "hours"
                ? `${(occurrences - 1) * intervalValue} Hours`
                : `${(occurrences - 1) * intervalValue} Minutes`}
            </span>
          </div>
        </div>

        {/* Section 6: Cadence Tuning Accordion */}
        <div className="bg-[#1b1b1f] p-4 rounded-2xl border border-white/5 space-y-3">
          <div
            onClick={() => setIsCadenceOpen(!isCadenceOpen)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#c8bfff]" />
              <span className="text-sm font-semibold text-[#e3e2e6]">
                Sound &amp; Cadence Preferences
              </span>
            </div>
            {isCadenceOpen ? (
              <ChevronUp className="w-5 h-5 text-[#928f9d]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#928f9d]" />
            )}
          </div>

          {isCadenceOpen && (
            <div className="space-y-4 pt-2 border-t border-white/5">
              {/* Recurrence Mode */}
              <div className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#928f9d]">
                  Recurrence Pattern
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#1f1f23] rounded-xl border border-white/5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setRepetitionMode("one_time");
                      setIsContinuous(false);
                    }}
                    className={`py-1.5 rounded-lg font-medium transition-all ${
                      repetitionMode === "one_time" && !isContinuous
                        ? "bg-[#c8bfff] text-[#121316] font-semibold"
                        : "text-[#c9c4d3]"
                    }`}
                  >
                    One-time
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRepetitionMode("daily");
                      setIsContinuous(false);
                    }}
                    className={`py-1.5 rounded-lg font-medium transition-all ${
                      repetitionMode === "daily" && !isContinuous
                        ? "bg-[#c8bfff] text-[#121316] font-semibold"
                        : "text-[#c9c4d3]"
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRepetitionMode("weekdays");
                      setIsContinuous(false);
                    }}
                    className={`py-1.5 rounded-lg font-medium transition-all ${
                      repetitionMode === "weekdays" && !isContinuous
                        ? "bg-[#c8bfff] text-[#121316] font-semibold"
                        : "text-[#c9c4d3]"
                    }`}
                  >
                    Weekdays
                  </button>
                </div>
              </div>

              {/* Repeat Days Chips */}
              {repetitionMode === "weekdays" && (
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-[#928f9d]">
                    Active Days
                  </span>
                  <div className="grid grid-cols-7 gap-1">
                    {weekdayLabels.map((w) => {
                      const isActive = selectedWeekdays.includes(w.day);
                      return (
                        <button
                          key={w.day}
                          type="button"
                          onClick={() => toggleWeekday(w.day)}
                          className={`h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                            isActive
                              ? "bg-[#c8bfff] text-[#121316] shadow-sm"
                              : "bg-[#1f1f23] text-[#c9c4d3] border border-white/5"
                          }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ringtone Audition */}
              <div className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#928f9d]">
                  Ringtone Tone
                </span>
                <div className="flex items-center justify-between bg-[#1f1f23] px-3.5 py-2.5 rounded-xl border border-white/5">
                  <select
                    value={sound}
                    onChange={(e) => setSound(e.target.value)}
                    className="bg-transparent text-sm text-[#e3e2e6] font-medium outline-none flex-1 cursor-pointer"
                  >
                    <option value={`Device Default: ${deviceRingtone.title}`} className="bg-[#1f1f23] text-[#40e17e] font-semibold">
                      📱 Device Default: {deviceRingtone.title}
                    </option>
                    <optgroup label="Custom Ringtones" className="bg-[#1b1b1f] text-[#c8bfff] font-bold">
                      {CustomRingtones.map((sp) => (
                        <option key={sp.id} value={sp.id} className="bg-[#1f1f23] text-[#e3e2e6] font-normal">
                          {sp.name} — {sp.description}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Ambient Presets" className="bg-[#1b1b1f] text-[#928f9d] font-bold">
                      {LegacyPresets.map((sp) => (
                        <option key={sp.id} value={sp.id} className="bg-[#1f1f23] text-[#e3e2e6] font-normal">
                          {sp.name} — {sp.description}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <button
                    type="button"
                    onClick={handleToggleSoundPreview}
                    className="w-9 h-9 rounded-full bg-[#292a2d] flex items-center justify-center text-[#c8bfff] active:scale-90 transition-all ml-2"
                  >
                    {isPlayingPreview ? (
                      <VolumeX className="w-4 h-4 text-[#ff5c5c]" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Vibration & Snooze Config */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  onClick={() => setVibration(!vibration)}
                  className="flex items-center justify-between bg-[#1f1f23] p-3 rounded-xl border border-white/5 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Vibrate className="w-4 h-4 text-[#928f9d]" />
                    <span>Haptic Motor</span>
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      vibration ? "bg-[#40e17e]" : "bg-[#484552]"
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between bg-[#1f1f23] p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#928f9d]" />
                    <span>Snooze</span>
                  </div>
                  <select
                    value={snoozeMinutes}
                    onChange={(e) => setSnoozeMinutes(parseInt(e.target.value))}
                    className="bg-transparent text-[#c8bfff] font-semibold outline-none cursor-pointer"
                  >
                    <option value={5} className="bg-[#1f1f23]">5 min</option>
                    <option value={10} className="bg-[#1f1f23]">10 min</option>
                    <option value={15} className="bg-[#1f1f23]">15 min</option>
                  </select>
                </div>

                <div
                  onClick={() => setGradualVolume(!gradualVolume)}
                  className="flex items-center justify-between bg-[#1f1f23] p-3 rounded-xl border border-white/5 cursor-pointer col-span-2"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#928f9d]" />
                    <span>Gentle Volume Ramp (30s)</span>
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      gradualVolume ? "bg-[#40e17e]" : "bg-[#484552]"
                    }`}
                  />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Sticky Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-14 rounded-full bg-[#c8bfff] text-[#121316] font-semibold text-base shadow-xl shadow-[#c8bfff]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-[#a99bff]"
          >
            <Clock className="w-5 h-5" />
            <span>Schedule {occurrences} Alarms</span>
          </button>
        </div>
      </div>
    </div>
  );
};
