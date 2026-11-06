import React, { useState, useEffect } from "react";
import intervalAlarmLogo from "../assets/interval_alarm_logo.svg";
import { AlarmApi } from "../services/alarmApi";

interface SplashScreenProps {
  isReady: boolean;
  onFinished: () => void;
  minDisplayTimeMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isReady,
  onFinished,
  minDisplayTimeMs = 1200,
}) => {
  const [isFading, setIsFading] = useState(false);
  const [mountedTime] = useState(Date.now());

  useEffect(() => {
    if (!isReady) return;

    const elapsed = Date.now() - mountedTime;
    const remainingTime = Math.max(0, minDisplayTimeMs - elapsed);

    const timer = setTimeout(() => {
      setIsFading(true);
      const closeTimer = setTimeout(() => {
        onFinished();
        AlarmApi.closeSplashscreen().catch(() => {});
      }, 400);

      return () => clearTimeout(closeTimer);
    }, remainingTime);

    return () => clearTimeout(timer);
  }, [isReady, mountedTime, minDisplayTimeMs, onFinished]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#121316] text-[#e3e2e6] select-none transition-opacity duration-400 ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background radial glow */}
      <div className="absolute w-72 h-72 rounded-full bg-[#c8bfff]/10 blur-3xl pointer-events-none animate-pulse" />

      {/* Brand Logo Container */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="absolute w-28 h-28 rounded-3xl bg-[#c8bfff]/20 blur-xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-3xl bg-[#1b1b1f] border border-white/10 p-3 shadow-2xl flex items-center justify-center overflow-hidden">
          <img
            src={intervalAlarmLogo}
            alt="iAlarm Logo"
            className="w-full h-full object-contain drop-shadow"
          />
        </div>
      </div>

      {/* Typography */}
      <div className="flex flex-col items-center text-center space-y-1 mb-8 z-10">
        <span className="text-[11px] uppercase font-semibold text-[#c8bfff] tracking-[0.25em]">
          Interval Alarm
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-[#e3e2e6]">
          iAlarm
        </h1>
        <span className="text-xs text-[#928f9d]">
          Circadian Rhythm &amp; Sequence Orchestrator
        </span>
      </div>

      {/* Minimalist Spinner */}
      <div className="relative flex items-center justify-center z-10 mb-6">
        <div className="w-6 h-6 rounded-full border-2 border-[#c8bfff]/15 border-t-[#c8bfff] animate-spin" />
      </div>

      {/* Version badge */}
      <div className="absolute bottom-8 flex flex-col items-center text-[11px] text-[#928f9d]/75 space-y-1">
        <span>v{__APP_VERSION__}</span>
      </div>
    </div>
  );
};

