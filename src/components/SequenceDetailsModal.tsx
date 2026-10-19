import React, { useState } from "react";
import {
  AlarmSequence,
  AppSettings,
} from "../types/alarm";
import {
  ArrowLeft,
  MoreVertical,
  CheckCircle2,
  Clock,
  RotateCcw,
  FastForward,
  Trash2,
  Copy,
  Edit3,
  Tag,
  AlertTriangle,
} from "lucide-react";


interface SequenceDetailsModalProps {
  alarm: AlarmSequence;
  settings: AppSettings;
  onClose: () => void;
  onToggle: (enabled: boolean) => void;
  onSkipNext: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const SequenceDetailsModal: React.FC<SequenceDetailsModalProps> = ({
  alarm,
  settings,
  onClose,
  onToggle,
  onSkipNext,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    if (!targetMs || targetMs <= Date.now()) return "Due now";
    const diffMins = Math.floor((targetMs - Date.now()) / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hrs > 0) return `Next in ${hrs}h ${mins}m`;
    return `Next in ${mins}m`;
  };

  const nextTime = alarm.next_trigger_time
    ? formatTime(alarm.next_trigger_time)
    : formatTime(alarm.start_time);

  const completedCount = Math.min(alarm.current_occurrence_index, alarm.total_occurrences);
  const intervalMs =
    alarm.interval_unit === "hours" ? alarm.interval_value * 3600000 : alarm.interval_value * 60000;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#121316] text-[#e3e2e6] overflow-y-auto">
      {/* Top Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#121316]/90 backdrop-blur-xl border-b border-white/5 pt-safe">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1b1b1f] border border-white/5 text-[#e3e2e6] active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-[#e3e2e6] truncate max-w-[200px]">
          {alarm.name}
        </h1>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1b1b1f] border border-white/5 text-[#c9c4d3] hover:text-[#e3e2e6] active:scale-95 transition-all"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-11 z-30 w-44 rounded-2xl bg-[#22252b] border border-white/10 shadow-2xl py-1 text-xs">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit();
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-[#292a2d] flex items-center gap-2 text-[#e3e2e6]"
              >
                <Edit3 className="w-4 h-4 text-[#c8bfff]" />
                <span>Edit Sequence</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDuplicate();
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-[#292a2d] flex items-center gap-2 text-[#e3e2e6]"
              >
                <Copy className="w-4 h-4 text-[#40e17e]" />
                <span>Duplicate Sequence</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteConfirm(true);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-[#292a2d] flex items-center gap-2 text-[#ff5c5c]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Sequence</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col px-4 pt-2 pb-24 space-y-4 max-w-lg mx-auto w-full">
        {/* Status Pill */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#40e17e] animate-pulse" />
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#40e17e]">
              Active Protocol
            </span>
          </div>
          <span className="text-xs text-[#928f9d]">
            {alarm.repetition_mode === "daily"
              ? "Daily repetition"
              : alarm.repetition_mode === "weekdays"
              ? "Mon - Fri"
              : alarm.repetition_mode === "continuous"
              ? "Continuous cycle"
              : "One-time"}
          </span>
        </div>

        {/* Hero Overview Card */}
        <div className="relative overflow-hidden rounded-3xl bg-[#1b1b1f] p-5 border border-white/10 shadow-xl">
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-[#c8bfff]/10 blur-3xl pointer-events-none" />

          {/* Title & Master Active Toggle */}
          <div className="relative z-10 flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#c8bfff]/10 text-[#c8bfff] text-[10px] font-semibold uppercase tracking-wider mb-1.5 border border-[#c8bfff]/20">
                <Tag className="w-3 h-3" />
                <span>{alarm.category.toUpperCase()} PACER</span>
              </div>
              <h2 className="text-xl font-bold text-[#e3e2e6] tracking-tight">
                {alarm.name}
              </h2>
            </div>

            {/* Master Toggle */}
            <div
              onClick={() => onToggle(!alarm.enabled)}
              className={`w-13 h-7 rounded-full p-0.5 transition-colors cursor-pointer flex items-center shrink-0 ${
                alarm.enabled ? "bg-[#c8bfff]" : "bg-[#292a2d]"
              }`}
              style={{ width: 52, height: 30 }}
            >
              <div
                className={`w-6 h-6 rounded-full transition-transform transform shadow-sm ${
                  alarm.enabled ? "translate-x-5 bg-[#2f1d7d]" : "translate-x-0.5 bg-[#928f9d]"
                }`}
              />
            </div>
          </div>

          {/* Focal Clock Display & Horological SVG Dial Motif */}
          <div className="relative z-10 flex items-center justify-between py-2">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#928f9d] block mb-0.5">
                Next Occurrence
              </span>
              <div className="flex items-baseline gap-1.5 text-4xl font-light text-[#e3e2e6] tabular-nums tracking-tight">
                <span>{nextTime.digits}</span>
                {nextTime.period && (
                  <span className="text-lg font-medium text-[#c8bfff]">
                    {nextTime.period}
                  </span>
                )}
              </div>
            </div>

            {/* Horological Ring Motif */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#343538"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#c8bfff"
                  strokeWidth="3.5"
                  strokeDasharray={`${(completedCount / alarm.total_occurrences) * 175} 175`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                <circle cx="32" cy="32" r="21" fill="none" stroke="#292a2d" strokeWidth="1.5" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[#c8bfff]">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Armed & Status Pills */}
          <div className="relative z-10 flex items-center gap-2 mt-2 mb-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-[#40e17e]/15 text-[#40e17e] px-3 py-1 rounded-full text-xs font-semibold border border-[#40e17e]/25">
              <span className="w-1.5 h-1.5 rounded-full bg-[#40e17e] animate-ping" />
              {alarm.enabled ? "Armed & Scheduled" : "Disabled"}
            </span>
            <span className="text-[#c9c4d3] text-xs flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#c8bfff]" />
              {getRemainingTimeStr(alarm.next_trigger_time)}
            </span>
          </div>

          {/* Cadence Progress Ladder */}
          <div className="relative z-10 bg-[#1f1f23] rounded-xl p-3 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#e3e2e6] font-medium">Sequence Cadence</span>
              <span className="text-[#c8bfff] font-semibold tabular-nums">
                {completedCount} of {alarm.total_occurrences} completed
              </span>
            </div>
            <div
              className="grid gap-1.5 h-2 w-full"
              style={{
                gridTemplateColumns: `repeat(${alarm.total_occurrences}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: alarm.total_occurrences }).map((_, stepIdx) => {
                const isPast = stepIdx < alarm.current_occurrence_index;
                const isCurrent = stepIdx === alarm.current_occurrence_index;
                return (
                  <div
                    key={stepIdx}
                    className={`rounded-full h-full transition-all ${
                      isPast
                        ? "bg-[#c8bfff] shadow-[0_0_8px_rgba(200,191,255,0.4)]"
                        : isCurrent && alarm.enabled
                        ? "bg-[#40e17e] animate-pulse"
                        : "bg-[#292a2d]"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Timeline of Occurrences (Sequence Ladder) */}
        <div className="bg-[#1b1b1f] rounded-2xl p-4 border border-white/5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#c8bfff]" />
              <h3 className="text-sm font-semibold text-[#e3e2e6]">Sequence Ladder</h3>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#928f9d] font-semibold">
              Interval: {alarm.interval_value}
              {alarm.interval_unit === "hours" ? "h" : "m"}
            </span>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-3 before:w-[2px] before:bg-[#292a2d]">
            {Array.from({ length: alarm.total_occurrences }).map((_, occIdx) => {
              const occTime = alarm.start_time + occIdx * intervalMs;
              const formatted = formatTime(occTime);
              const isPast = occIdx < alarm.current_occurrence_index;
              const isNext = occIdx === alarm.current_occurrence_index;

              if (isPast) {
                return (
                  <div key={occIdx} className="relative flex items-start justify-between min-h-[44px]">
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#1b1b1f] flex items-center justify-center text-[#c8bfff]">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-[#928f9d] line-through tabular-nums">
                          {formatted.digits} {formatted.period}
                        </span>
                        <span className="text-[10px] uppercase text-[#928f9d]">Done</span>
                      </div>
                      <p className="text-[11px] text-[#928f9d]">
                        Interval {occIdx + 1} · Occurrence finished
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#292a2d] text-[#928f9d] self-center">
                      Completed
                    </span>
                  </div>
                );
              }

              if (isNext) {
                return (
                  <div
                    key={occIdx}
                    className="relative flex flex-col gap-2 p-3 -ml-3 rounded-xl bg-[#292a2d]/80 border border-[#c8bfff]/30 shadow-[0_0_20px_-4px_rgba(200,191,255,0.2)]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2.5">
                        <div className="w-3.5 h-3.5 mt-1 rounded-full bg-[#c8bfff] flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#121316]" />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-bold text-[#c8bfff] tabular-nums">
                              {formatted.digits} {formatted.period}
                            </span>
                            <span className="text-[10px] uppercase font-bold bg-[#c8bfff]/20 text-[#c8bfff] px-1.5 py-0.5 rounded">
                              Active Next
                            </span>
                          </div>
                          <p className="text-xs text-[#e3e2e6]">
                            Interval {occIdx + 1} of {alarm.total_occurrences} · Next ring trigger
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                      <button
                        onClick={onSkipNext}
                        className="h-8 px-3 rounded-full bg-[#38393c] text-[#e3e2e6] hover:bg-[#484552] active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5"
                      >
                        <FastForward className="w-3.5 h-3.5 text-[#c8bfff]" />
                        <span>Skip next</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // Future queued occurrences
              return (
                <div key={occIdx} className="relative flex items-start justify-between min-h-[44px]">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#292a2d] flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#484552]" />
                  </div>
                  <div className="min-w-0 pr-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-[#e3e2e6] tabular-nums">
                        {formatted.digits} {formatted.period}
                      </span>
                      <span className="text-[10px] uppercase text-[#928f9d]">
                        +{occIdx * alarm.interval_value}
                        {alarm.interval_unit === "hours" ? "h" : "m"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#928f9d]">
                      Interval {occIdx + 1} · Queued in sequence
                    </p>
                  </div>
                  <span className="text-[10px] text-[#928f9d] self-center">Queued</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onEdit}
            className="h-12 rounded-2xl bg-[#1b1b1f] hover:bg-[#292a2d] text-[#e3e2e6] border border-white/5 font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Edit3 className="w-4 h-4 text-[#c8bfff]" />
            <span>Edit Interval</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="h-12 rounded-2xl bg-[#ff5c5c]/10 hover:bg-[#ff5c5c]/20 text-[#ff5c5c] border border-[#ff5c5c]/20 font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Sequence</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#1f1f23] p-5 border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#ff5c5c]">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-[#e3e2e6]">Delete Sequence?</h3>
            </div>
            <p className="text-xs text-[#c9c4d3]">
              Are you sure you want to delete <span className="text-[#e3e2e6] font-semibold">"{alarm.name}"</span>? All upcoming native scheduled alarms in this sequence will be permanently canceled.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#292a2d] text-[#e3e2e6] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#ff5c5c] text-white text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
