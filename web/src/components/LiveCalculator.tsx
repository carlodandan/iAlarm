import { useState, useMemo, useEffect, useRef } from "react";
import { Clock, Sparkles, RotateCw } from "lucide-react";
import { animate } from "animejs";

interface CalculatedOccurrence {
  index: number;
  timeMs: number;
  formattedTime: string;
  offsetLabel: string;
  dayLabel: string;
  isAnchor: boolean;
  isFinal: boolean;
}

export function LiveCalculator() {
  // Config state
  const [anchorHours, setAnchorHours] = useState(6);
  const [anchorMinutes, setAnchorMinutes] = useState(0);
  const [anchorPeriod, setAnchorPeriod] = useState<"AM" | "PM">("AM");
  const [intervalValue, setIntervalValue] = useState(4);
  const [intervalUnit, setIntervalUnit] = useState<"hours" | "minutes">("hours");
  const [occurrences, setOccurrences] = useState(4);
  const [recurrenceMode, setRecurrenceMode] = useState<"one_time" | "daily" | "continuous">("daily");
  const [is24h, setIs24h] = useState(false);

  const ladderRef = useRef<HTMLDivElement>(null);
  const [today] = useState(() => new Date());

  // Quick Preset Chips
  const presetIntervals = [
    { label: "30m", val: 30, unit: "minutes" as const },
    { label: "45m", val: 45, unit: "minutes" as const },
    { label: "1h", val: 1, unit: "hours" as const },
    { label: "2h", val: 2, unit: "hours" as const },
    { label: "4h", val: 4, unit: "hours" as const },
    { label: "6h", val: 6, unit: "hours" as const },
    { label: "8h", val: 8, unit: "hours" as const },
    { label: "12h", val: 12, unit: "hours" as const },
  ];

  // Mathematical Calculation Engine (matching Rust scheduler.rs)
  const schedule = useMemo<CalculatedOccurrence[]>(() => {
    // Determine base anchor time today
    const now = today;
    let hour24 = anchorHours;
    if (anchorPeriod === "PM" && hour24 < 12) hour24 += 12;
    if (anchorPeriod === "AM" && hour24 === 12) hour24 = 0;

    const baseDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour24,
      anchorMinutes,
      0,
      0
    );
    const startMs = baseDate.getTime();
    const intervalMs =
      intervalUnit === "minutes"
        ? intervalValue * 60 * 1000
        : intervalValue * 3600 * 1000;

    const items: CalculatedOccurrence[] = [];

    for (let i = 0; i < occurrences; i++) {
      const triggerTime = startMs + i * intervalMs;
      const d = new Date(triggerTime);

      const h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, "0");

      let formattedTime = "";
      if (is24h) {
        formattedTime = `${h.toString().padStart(2, "0")}:${m}`;
      } else {
        const period = h >= 12 ? "PM" : "AM";
        const displayH = (h % 12 || 12).toString().padStart(2, "0");
        formattedTime = `${displayH}:${m} ${period}`;
      }

      // Day rollover detection relative to anchor day
      const dayDiff = Math.floor(
        (new Date(d.toDateString()).getTime() -
          new Date(baseDate.toDateString()).getTime()) /
          (86400 * 1000)
      );

      let dayLabel = "Today";
      if (dayDiff === 1) dayLabel = "Tomorrow";
      else if (dayDiff > 1) dayLabel = `+${dayDiff} Days`;

      // Relative offset label
      const totalOffsetMinutes = Math.floor((i * intervalMs) / 60000);
      let offsetLabel = "Start (Genesis)";
      if (i > 0) {
        if (totalOffsetMinutes >= 60) {
          const offH = Math.floor(totalOffsetMinutes / 60);
          const offM = totalOffsetMinutes % 60;
          offsetLabel = offM > 0 ? `+${offH}h ${offM}m` : `+${offH}h`;
        } else {
          offsetLabel = `+${totalOffsetMinutes}m`;
        }
      }

      items.push({
        index: i + 1,
        timeMs: triggerTime,
        formattedTime,
        offsetLabel,
        dayLabel,
        isAnchor: i === 0,
        isFinal: i === occurrences - 1,
      });
    }

    return items;
  }, [
    today,
    anchorHours,
    anchorMinutes,
    anchorPeriod,
    intervalValue,
    intervalUnit,
    occurrences,
    is24h,
  ]);

  // Animate ladder items with animejs whenever calculated schedule changes
  useEffect(() => {
    if (ladderRef.current) {
      animate(ladderRef.current.children, {
        opacity: [0, 1],
        translateX: [-10, 0],
        delay: (index: number) => index * 45,
        duration: 350,
        ease: "easeOutCubic",
      });
    }
  }, [schedule]);

  // Quick anchor presets
  const handleSetTopHour = () => {
    const nextH = (new Date().getHours() + 1) % 24;
    setAnchorHours(nextH % 12 || 12);
    setAnchorPeriod(nextH >= 12 ? "PM" : "AM");
    setAnchorMinutes(0);
  };

  const handleSetMorning = () => {
    setAnchorHours(7);
    setAnchorMinutes(0);
    setAnchorPeriod("AM");
  };

  const totalDurationMinutes =
    (occurrences - 1) *
    (intervalUnit === "minutes" ? intervalValue : intervalValue * 60);
  const totalDurationHours = (totalDurationMinutes / 60).toFixed(1);

  return (
    <section id="calculator" className="py-24 bg-[#121316] relative border-y border-white/5">
      {/* Background glow accents */}
      <div className="absolute top-1/2 left-10 w-96 h-96 bg-[#c8bfff]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#40e17e]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c8bfff]">
            Interactive Cadence Engine
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#e3e2e6] tracking-tight">
            Try the Formula Live in Your Browser
          </h2>
          <p className="text-sm sm:text-base text-[#c9c4d3] leading-relaxed">
            See how iAlarm calculates exact trigger times, relative offsets, and midnight calendar rollovers with zero manual guesswork.
          </p>
        </div>

        {/* Two-Column Interactive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel (Left, 6 cols) */}
          <div className="lg:col-span-6 bg-[#1b1b1f] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#c8bfff]" />
                <h3 className="font-bold text-base text-[#e3e2e6]">Sequence Parameters</h3>
              </div>
              <button
                type="button"
                onClick={() => setIs24h(!is24h)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#292a2d] hover:bg-[#343538] text-[#c8bfff] border border-white/5 transition-all"
              >
                {is24h ? "Format: 24h" : "Format: 12h"}
              </button>
            </div>

            {/* 1. Anchor Start Time */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-[#e3e2e6] flex items-center gap-1.5">
                  Anchor Start Time <span className="font-mono text-[#c8bfff] text-[11px]">(T₀)</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSetTopHour}
                    className="text-[11px] text-[#c8bfff] hover:underline cursor-pointer"
                  >
                    Top of Hour
                  </button>
                  <span className="text-white/20">•</span>
                  <button
                    type="button"
                    onClick={handleSetMorning}
                    className="text-[11px] text-[#c8bfff] hover:underline cursor-pointer"
                  >
                    7:00 AM
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-[#292a2d] rounded-2xl p-1.5 border border-white/5 justify-center">
                  <select
                    value={anchorHours}
                    onChange={(e) => setAnchorHours(parseInt(e.target.value))}
                    className="bg-transparent text-xl font-bold text-[#e3e2e6] outline-none tabular-nums cursor-pointer px-2"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h} className="bg-[#1b1b1f] text-[#e3e2e6]">
                        {h.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  <span className="text-xl font-bold text-[#928f9d]">:</span>
                  <select
                    value={anchorMinutes}
                    onChange={(e) => setAnchorMinutes(parseInt(e.target.value))}
                    className="bg-transparent text-xl font-bold text-[#e3e2e6] outline-none tabular-nums cursor-pointer px-2"
                  >
                    {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                      <option key={m} value={m} className="bg-[#1b1b1f] text-[#e3e2e6]">
                        {m.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex bg-[#292a2d] p-1 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setAnchorPeriod("AM")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      anchorPeriod === "AM"
                        ? "bg-[#c8bfff] text-[#121316] shadow-sm"
                        : "text-[#928f9d] hover:text-[#e3e2e6]"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnchorPeriod("PM")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      anchorPeriod === "PM"
                        ? "bg-[#c8bfff] text-[#121316] shadow-sm"
                        : "text-[#928f9d] hover:text-[#e3e2e6]"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Interval Step */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-[#e3e2e6] flex items-center gap-1.5">
                  Interval Cadence Step <span className="font-mono text-[#c8bfff] text-[11px]">(Δ)</span>
                </label>
                <span className="text-[#928f9d]">
                  Every {intervalValue} {intervalUnit}
                </span>
              </div>

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1.5">
                {presetIntervals.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setIntervalValue(preset.val);
                      setIntervalUnit(preset.unit);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      intervalValue === preset.val && intervalUnit === preset.unit
                        ? "bg-[#c8bfff] text-[#121316] shadow-md shadow-[#c8bfff]/20"
                        : "bg-[#292a2d] text-[#c9c4d3] hover:bg-[#35363a] border border-white/5"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Stepper Input */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 flex items-center bg-[#292a2d] rounded-2xl p-2 border border-white/5 justify-between">
                  <button
                    type="button"
                    onClick={() => setIntervalValue(Math.max(1, intervalValue - 1))}
                    className="w-9 h-9 rounded-xl bg-[#1b1b1f] hover:bg-[#202125] text-lg font-bold text-[#e3e2e6] flex items-center justify-center active:scale-95"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold text-[#e3e2e6] tabular-nums">
                    {intervalValue}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIntervalValue(intervalValue + 1)}
                    className="w-9 h-9 rounded-xl bg-[#1b1b1f] hover:bg-[#202125] text-lg font-bold text-[#e3e2e6] flex items-center justify-center active:scale-95"
                  >
                    +
                  </button>
                </div>

                <div className="flex bg-[#292a2d] p-1 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setIntervalUnit("hours")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      intervalUnit === "hours"
                        ? "bg-[#c8bfff] text-[#121316]"
                        : "text-[#928f9d]"
                    }`}
                  >
                    Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntervalUnit("minutes")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      intervalUnit === "minutes"
                        ? "bg-[#c8bfff] text-[#121316]"
                        : "text-[#928f9d]"
                    }`}
                  >
                    Mins
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Occurrence Count */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-[#e3e2e6] flex items-center gap-1.5">
                  Occurrence Count <span className="font-mono text-[#c8bfff] text-[11px]">(N)</span>
                </label>
                <span className="text-[#928f9d]">{occurrences} alerts total</span>
              </div>
              <div className="flex items-center bg-[#292a2d] rounded-2xl p-2 border border-white/5 justify-between">
                <button
                  type="button"
                  onClick={() => setOccurrences(Math.max(1, occurrences - 1))}
                  className="w-9 h-9 rounded-xl bg-[#1b1b1f] hover:bg-[#202125] text-lg font-bold text-[#e3e2e6] flex items-center justify-center active:scale-95"
                >
                  -
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-[#e3e2e6] tabular-nums">
                    {occurrences}
                  </span>
                  <span className="text-[10px] text-[#c8bfff] font-semibold">
                    {occurrences === 1 ? "1 Occurrence" : `${occurrences} Occurrences`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOccurrences(Math.min(12, occurrences + 1))}
                  className="w-9 h-9 rounded-xl bg-[#1b1b1f] hover:bg-[#202125] text-lg font-bold text-[#e3e2e6] flex items-center justify-center active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* 4. Recurrence Mode */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-semibold text-[#e3e2e6]">Repetition Cadence</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRecurrenceMode("daily")}
                  className={`py-2 px-3 rounded-xl font-semibold border transition-all ${
                    recurrenceMode === "daily"
                      ? "bg-[#c8bfff] text-[#121316] border-[#c8bfff]"
                      : "bg-[#292a2d] text-[#c9c4d3] border-white/5 hover:bg-[#343538]"
                  }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceMode("one_time")}
                  className={`py-2 px-3 rounded-xl font-semibold border transition-all ${
                    recurrenceMode === "one_time"
                      ? "bg-[#c8bfff] text-[#121316] border-[#c8bfff]"
                      : "bg-[#292a2d] text-[#c9c4d3] border-white/5 hover:bg-[#343538]"
                  }`}
                >
                  One-Time
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceMode("continuous")}
                  className={`py-2 px-3 rounded-xl font-semibold border transition-all ${
                    recurrenceMode === "continuous"
                      ? "bg-[#c8bfff] text-[#121316] border-[#c8bfff]"
                      : "bg-[#292a2d] text-[#c9c4d3] border-white/5 hover:bg-[#343538]"
                  }`}
                >
                  Continuous
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Preview Tree Output (Right, 6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Summary Bar */}
            <div className="bg-[#1b1b1f] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#40e17e]/15 text-[#40e17e] flex items-center justify-center border border-[#40e17e]/20 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#40e17e] tracking-widest block">
                    Calculated Cadence
                  </span>
                  <span className="text-sm font-bold text-[#e3e2e6]">
                    Span: ~{totalDurationHours} hrs ({occurrences} alerts)
                  </span>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#c8bfff]/15 text-[#c8bfff] border border-[#c8bfff]/20 font-mono tracking-wide flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[#928f9d] font-sans text-[11px]">Formula:</span>
                <span>T(n) = T₀ + (n × Δ)</span>
              </div>
            </div>

            {/* Sequence Ladder Cards */}
            <div
              ref={ladderRef}
              className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1"
            >
              {schedule.map((item) => (
                <div
                  key={item.index}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    item.isAnchor
                      ? "bg-[#292a2d] border-[#c8bfff]/40 shadow-md shadow-[#c8bfff]/5"
                      : "bg-[#1b1b1f] border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Index Ring */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        item.isAnchor
                          ? "bg-[#c8bfff] text-[#121316]"
                          : "bg-[#292a2d] text-[#c9c4d3] border border-white/5"
                      }`}
                    >
                      #{item.index}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[#e3e2e6] tabular-nums">
                          {item.formattedTime}
                        </span>
                        {item.isAnchor && (
                          <span className="text-[10px] font-bold text-[#c8bfff] bg-[#c8bfff]/15 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Anchor
                          </span>
                        )}
                        {item.isFinal && !item.isAnchor && (
                          <span className="text-[10px] font-bold text-[#40e17e] bg-[#40e17e]/15 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Final
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#928f9d]">
                        Cadence step: {item.offsetLabel}
                      </span>
                    </div>
                  </div>

                  {/* Day Rollover Badge */}
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      item.dayLabel === "Tomorrow" || item.dayLabel.includes("+")
                        ? "bg-[#ff5c5c]/15 text-[#ff7d7d] border border-[#ff5c5c]/20"
                        : "bg-[#292a2d] text-[#928f9d]"
                    }`}
                  >
                    {item.dayLabel}
                  </span>
                </div>
              ))}
            </div>

            {/* Footnote on Native Execution */}
            <div className="p-4 rounded-2xl bg-[#1b1b1f]/60 border border-white/5 text-xs text-[#928f9d] flex items-center gap-3">
              <RotateCw className="w-4 h-4 text-[#40e17e] shrink-0" />
              <span>
                On Android, dismissing or skipping occurrence #1 automatically arms occurrence #2 in the system AlarmClock register without keeping the app open.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
