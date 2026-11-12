import { useEffect, useRef } from "react";
import {
  Download,
  ShieldCheck,
  ArrowRight,
  Smartphone,
  Cpu,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { animate } from "animejs";
import homeScreenshot from "../assets/images/home_page.png";

export function Hero() {
  const badge1Ref = useRef<HTMLDivElement>(null);
  const badge2Ref = useRef<HTMLDivElement>(null);
  const badge3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subtle Anime.js floating animation for hero badges
    if (badge1Ref.current && badge2Ref.current && badge3Ref.current) {
      animate(badge1Ref.current, {
        translateY: [-6, 6],
        duration: 3200,
        direction: "alternate",
        loop: true,
        ease: "easeInOutQuad",
      });

      animate(badge2Ref.current, {
        translateY: [8, -8],
        duration: 3800,
        direction: "alternate",
        loop: true,
        ease: "easeInOutQuad",
      });

      animate(badge3Ref.current, {
        translateY: [-5, 7],
        duration: 3500,
        direction: "alternate",
        loop: true,
        ease: "easeInOutQuad",
      });
    }
  }, []);

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background radial ambient lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#c8bfff]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-[#40e17e]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & Value Proposition */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            {/* Announcement Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1b1b1f] border border-white/10 shadow-sm text-xs text-[#c9c4d3]">
              <span className="w-2 h-2 rounded-full bg-[#40e17e] animate-ping" />
              <span className="font-semibold text-[#c8bfff]">Offline-First Native Android</span>
              <span className="text-[#928f9d]">•</span>
              <span className="text-[#e3e2e6]">Zero WebView Background Drain</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#e3e2e6] leading-[1.1]">
              Atomic Interval Alarms.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c8bfff] via-[#e2dcff] to-[#40e17e]">
                Exact Native Reliability.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#c9c4d3] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Stop setting four separate alarms for one recurring routine. Define your anchor time, choose your interval, and let Android's native <code className="text-[#c8bfff] font-mono font-medium">AlarmManager.setAlarmClock()</code> orchestrate your entire sequence with horological precision.
            </p>

            {/* Key Feature Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-[#c9c4d3] max-w-xl mx-auto lg:mx-0">
              <div className="flex items-center gap-2 bg-[#1b1b1f]/60 p-2.5 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-[#40e17e] shrink-0" />
                <span>Bypasses Android Doze mode natively</span>
              </div>
              <div className="flex items-center gap-2 bg-[#1b1b1f]/60 p-2.5 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-[#40e17e] shrink-0" />
                <span>Isolated snooze ladder progression</span>
              </div>
              <div className="flex items-center gap-2 bg-[#1b1b1f]/60 p-2.5 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-[#40e17e] shrink-0" />
                <span>Midnight &amp; multi-day auto-rollover</span>
              </div>
              <div className="flex items-center gap-2 bg-[#1b1b1f]/60 p-2.5 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-[#40e17e] shrink-0" />
                <span>12 Bundled high-fidelity custom ringtones</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <a
                href="https://github.com/carlodandan/iAlarm/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto h-12 px-7 rounded-2xl bg-[#c8bfff] hover:bg-[#dcd6ff] text-[#121316] font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-[#c8bfff]/25 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Android APK (v{import.meta.env.VITE_APP_VERSION})</span>
              </a>
              <a
                href="#calculator"
                className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-[#1b1b1f] hover:bg-[#292a2d] text-[#e3e2e6] font-semibold text-sm flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-95"
              >
                <span>Interactive Cadence Preview</span>
                <ArrowRight className="w-4 h-4 text-[#c8bfff]" />
              </a>
            </div>

            {/* Specs Footnote */}
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-6 text-[11px] text-[#928f9d]">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#c8bfff]" />
                Android 7.0 - 15 (API 24-35)
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#40e17e]" />
                ARM64 &amp; Universal APK
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#c8bfff]" />
                100% Free &amp; Open Source
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Phone Mockup with Floating Badges */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Horological Ring Backdrop */}
            <div className="absolute w-[440px] h-[440px] rounded-full border border-[#c8bfff]/10 animate-spin-slow pointer-events-none" />
            <div className="absolute w-[360px] h-[360px] rounded-full border border-dashed border-[#c8bfff]/15 pointer-events-none" />

            {/* Phone Container */}
            <div className="relative z-20 w-[290px] sm:w-[320px] rounded-[42px] p-3 bg-gradient-to-b from-[#292a2d] via-[#1b1b1f] to-[#121316] shadow-2xl shadow-black/80 border border-white/15">
              {/* Phone Speaker & Camera Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 rounded-full bg-[#121316] z-30 flex items-center justify-center">
                <div className="w-8 h-1 rounded-full bg-white/20" />
              </div>

              {/* Screen Content */}
              <div className="relative rounded-[34px] overflow-hidden bg-[#121316] border border-white/5">
                <img
                  src={homeScreenshot}
                  alt="iAlarm Home Screen"
                  className="w-full h-auto object-cover block"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>

              {/* Floating Badge 1: Top Left */}
              <div
                ref={badge1Ref}
                className="absolute -top-4 -left-6 sm:-left-10 bg-[#1b1b1f]/90 backdrop-blur-md border border-[#40e17e]/30 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 z-30"
              >
                <div className="w-7 h-7 rounded-full bg-[#40e17e]/15 text-[#40e17e] flex items-center justify-center border border-[#40e17e]/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-[#40e17e] uppercase tracking-wider">
                    AlarmManager
                  </span>
                  <span className="text-xs font-semibold text-[#e3e2e6]">
                    Bypasses Doze Mode
                  </span>
                </div>
              </div>

              {/* Floating Badge 2: Bottom Right */}
              <div
                ref={badge2Ref}
                className="absolute -bottom-6 -right-6 sm:-right-8 bg-[#1b1b1f]/90 backdrop-blur-md border border-[#c8bfff]/30 px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 z-30"
              >
                <div className="w-7 h-7 rounded-full bg-[#c8bfff]/15 text-[#c8bfff] flex items-center justify-center border border-[#c8bfff]/20">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-[#c8bfff] uppercase tracking-wider">
                    Isolated Snooze
                  </span>
                  <span className="text-xs font-semibold text-[#e3e2e6]">
                    Preserves Master Grid
                  </span>
                </div>
              </div>

              {/* Floating Badge 3: Mid Left */}
              <div
                ref={badge3Ref}
                className="absolute top-1/2 -left-8 sm:-left-12 bg-[#1b1b1f]/95 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex items-center gap-2 z-30"
              >
                <span className="w-2 h-2 rounded-full bg-[#c8bfff] animate-pulse" />
                <span className="text-[11px] font-medium text-[#c9c4d3]">
                  0% WebView Idle Drain
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
