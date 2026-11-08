import { useState } from "react";
import { Smartphone, Check, Layers, Sliders } from "lucide-react";
import homeImg from "../assets/images/home_page.png";
import sched1Img from "../assets/images/schedule_page_01.png";
import sched2Img from "../assets/images/schedule_page_02.png";

export function Showcase() {
  const [activeTab, setActiveTab] = useState<"home" | "create" | "preview">("home");

  const screens = {
    home: {
      title: "Hero Overview & Active Sequences",
      subtitle: "Observe your next upcoming occurrence, time remaining, and toggle routines with a single mechanical switch.",
      image: homeImg,
      highlights: [
        "Dynamic Horological SVG dial depicting remaining cycle time",
        "At-a-glance status indicators (Genesis, Armed, Dismissed)",
        "Single-tap sequence activation and isolation controls",
        "Tabular numeral digital clocks eliminating horizontal layout shift",
      ],
    },
    create: {
      title: "Sequence Cadence Configuration",
      subtitle: "Effortlessly configure multi-occurrence intervals with intuitive stepping controls and rapid presets.",
      image: sched1Img,
      highlights: [
        "Top-of-Hour & Now (+5m) quick anchor jump buttons",
        "Interval units: granular minutes (hydration) or hours (medication)",
        "Presets chips for 30m, 1h, 2h, 4h, 6h, 8h, 12h",
        "Supports One-Time, Daily, Selected Weekdays, and Continuous modes",
      ],
    },
    preview: {
      title: "Live Preview Tree & Ringtone Audition",
      subtitle: "Verify your calculated schedule before saving, with relative offsets and 12 custom ringtones.",
      image: sched2Img,
      highlights: [
        "Real-time tree showing relative step offsets and midnight day rollovers",
        "Audition bundled audio tracks with haptic motor vibration sync",
        "Gradual 30-second volume ramp option for gentle circadian waking",
        "Customizable snooze intervals (5m, 10m, 15m, 20m)",
      ],
    },
  };

  const current = screens[activeTab];

  return (
    <section id="showcase" className="py-24 bg-[#1b1b1f]/50 border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c8bfff]">
            Interface Showcase
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#e3e2e6] tracking-tight">
            Designed for Focus, Precision, and Calm
          </h2>
          <p className="text-sm sm:text-base text-[#c9c4d3]">
            Explore the Android native user interface in high resolution.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#1b1b1f] border border-white/10 shadow-lg">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "home"
                  ? "bg-[#c8bfff] text-[#121316] shadow-md shadow-[#c8bfff]/20"
                  : "text-[#c9c4d3] hover:text-white"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Home Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "create"
                  ? "bg-[#c8bfff] text-[#121316] shadow-md shadow-[#c8bfff]/20"
                  : "text-[#c9c4d3] hover:text-white"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Cadence Setup</span>
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "preview"
                  ? "bg-[#c8bfff] text-[#121316] shadow-md shadow-[#c8bfff]/20"
                  : "text-[#c9c4d3] hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Schedule &amp; Tones</span>
            </button>
          </div>
        </div>

        {/* Showcase Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-[#1b1b1f] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl">
          {/* Left Details */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#40e17e] uppercase tracking-wider block">
                Screen Overview
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#e3e2e6]">
                {current.title}
              </h3>
              <p className="text-sm text-[#c9c4d3] leading-relaxed">
                {current.subtitle}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {current.highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-[#292a2d]/60 border border-white/5 p-3 rounded-2xl text-xs sm:text-sm text-[#e3e2e6]"
                >
                  <Check className="w-4 h-4 text-[#40e17e] shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <a
                href="https://github.com/carlodandan/iAlarm/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#c8bfff] hover:underline"
              >
                <span>Experience it on your Android device</span>
                <span>→</span>
              </a>
            </div>
          </div>

          {/* Right Phone Mockup Container */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-[280px] sm:w-[320px] rounded-[38px] p-2.5 bg-gradient-to-b from-[#34353a] via-[#1b1b1f] to-[#121316] shadow-2xl border border-white/20">
              <div className="rounded-[30px] overflow-hidden bg-[#121316]">
                <img
                  src={current.image}
                  alt={current.title}
                  className="w-full h-auto object-cover block shadow-inner"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
