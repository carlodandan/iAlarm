import {
  Zap,
  Repeat,
  Moon,
  Layers,
  Cpu,
  PowerOff,
  CheckCircle2,
} from "lucide-react";

export function Features() {
  const pillars = [
    {
      icon: <Repeat className="w-6 h-6 text-[#c8bfff]" />,
      badge: "Atomic Control",
      title: "One Sequence, Zero Repetition",
      description:
        "Standard clock apps force you to manually set, calculate, and toggle 4 separate alarms. With iAlarm, set your anchor time and interval step once. Toggle or edit the whole routine atomically.",
      highlight: "1 Switch controls all occurrences",
    },
    {
      icon: <Zap className="w-6 h-6 text-[#40e17e]" />,
      badge: "Android AlarmManager",
      title: "Hardware-Level Exact Execution",
      description:
        "Uses Android's setAlarmClock API to register exact alarms. Bypasses Doze mode battery restrictions, acquires SCREEN_BRIGHT_WAKE_LOCK, and turns the display on over the keyguard.",
      highlight: "Guaranteed ring during deep sleep",
    },
    {
      icon: <PowerOff className="w-6 h-6 text-[#c8bfff]" />,
      badge: "Zero-WebView Drain",
      title: "Pure Headless Background Life",
      description:
        "Active sequences are cached directly to Android SharedPreferences. The web runtime terminates cleanly when minimized, while native Kotlin BroadcastReceivers advance occurrences headlessly.",
      highlight: "0% Battery drain in idle state",
    },
    {
      icon: <Layers className="w-6 h-6 text-[#40e17e]" />,
      badge: "Progression Ladder",
      title: "Isolated Snooze & Skip Logic",
      description:
        "Snoozing or skipping occurrence #2 will never displace or shift occurrence #3. The master cadence grid remains mathematically pinned to your original anchor start time.",
      highlight: "Cadence stays locked",
    },
    {
      icon: <Cpu className="w-6 h-6 text-[#c8bfff]" />,
      badge: "Rust Scheduler Core",
      title: "Midnight Rollover & Recovery",
      description:
        "Stateless Rust algorithms calculate multi-day spans and calendar rollovers. If your device powers down, expired alarms are discarded on boot so you are never barraged with old alarms.",
      highlight: "Automatic reboot reconstruction",
    },
    {
      icon: <Moon className="w-6 h-6 text-[#40e17e]" />,
      badge: "Circadian Luxury",
      title: "Engineered for Night Awakening",
      description:
        "Pure dark obsidian theme (#121316) reduces ocular stress and melatonin suppression. Horological SVG dials, electric lavender focus rings, and jitter-free tabular digital readouts.",
      highlight: "True AMOLED ocular comfort",
    },
  ];

  return (
    <section id="features" className="py-24 bg-[#121316] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c8bfff]">
            Engineered For Reliability
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#e3e2e6] tracking-tight">
            Why Standard Clock Apps Fail at Interval Routines
          </h2>
          <p className="text-sm sm:text-base text-[#c9c4d3] leading-relaxed">
            iAlarm replaces chaotic lists of isolated alarms with a deterministic, mathematically linked sequence engine built for hardware certainty.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className="group bg-[#1b1b1f] hover:bg-[#202126] border border-white/5 hover:border-white/15 rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/20 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#292a2d] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {pillar.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#928f9d] bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    {pillar.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#e3e2e6] group-hover:text-white transition-colors">
                  {pillar.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#c9c4d3] leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-white/5 flex items-center gap-2 text-xs font-semibold text-[#c8bfff]">
                <CheckCircle2 className="w-4 h-4 text-[#40e17e]" />
                <span>{pillar.highlight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
