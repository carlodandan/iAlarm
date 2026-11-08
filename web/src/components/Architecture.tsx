import { Cpu, Smartphone, Layers, Check, X } from "lucide-react";

export function Architecture() {
  const tiers = [
    {
      level: "Layer 1: Presentation",
      tech: "React 19 • TypeScript • TailwindCSS v4",
      color: "border-[#c8bfff]/40",
      icon: <Layers className="w-5 h-5 text-[#c8bfff]" />,
      responsibilities: [
        "Hero overview with live second-by-second countdown",
        "Interactive Horological SVG dials & occurrence ladders",
        "Real-time schedule calculation preview before commitment",
        "System diagnostics and runtime permission status view",
      ],
    },
    {
      level: "Layer 2: Domain Core",
      tech: "Rust • Tauri 2 Runtime • Tokio",
      color: "border-[#DEA584]/40",
      icon: <Cpu className="w-5 h-5 text-[#DEA584]" />,
      responsibilities: [
        "Stateless deterministic interval formula: T(n) = T₀ + (n × Δ)",
        "Midnight multi-day and ISO weekday projection algorithms",
        "Isolated snooze cadence without modifying master anchor grid",
        "Atomic disk persistence with schema versioning and recovery",
      ],
    },
    {
      level: "Layer 3: Native Hardware",
      tech: "Android Kotlin • AlarmManager • WakeLock",
      color: "border-[#40e17e]/40",
      icon: <Smartphone className="w-5 h-5 text-[#40e17e]" />,
      responsibilities: [
        "Registers exact alarms with AlarmManager.setAlarmClock()",
        "SCREEN_BRIGHT_WAKE_LOCK & showWhenLocked keyguard bypass",
        "Headless SharedPreferences mirror for zero-webview execution",
        "BootReceiver: automatic rescheduling after device restarts",
      ],
    },
  ];

  const comparisons = [
    {
      criterion: "Routine Setup",
      standard: "Requires creating and setting 4-8 alarms individually",
      ialarm: "Define 1 anchor time and interval step; all occurrences generate automatically",
    },
    {
      criterion: "Sequence Toggle",
      standard: "Must manually flip 4-8 toggles every morning and night",
      ialarm: "Atomic master switch enables or pauses the entire cadence in 1 tap",
    },
    {
      criterion: "Snooze Behavior",
      standard: "Snooze can collide with or delay the next upcoming alarm",
      ialarm: "Isolated snooze event: subsequent occurrences retain fixed absolute timestamps",
    },
    {
      criterion: "Background Battery Drain",
      standard: "Requires background service polling or push notifications",
      ialarm: "Zero WebView drain: native OS registers handle exact waking with 0% CPU idle",
    },
    {
      criterion: "Midnight Rollovers",
      standard: "Often requires manual date setting to avoid triggering on wrong day",
      ialarm: "Rust engine automatically tracks multi-day crossings and labels Tomorrow/+2 Days",
    },
    {
      criterion: "Device Reboot Recovery",
      standard: "Many clock apps fail to reconstruct recurring timers after reboot",
      ialarm: "Native BootReceiver rebuilds future occurrences and skips past stale events",
    },
  ];

  return (
    <section id="architecture" className="py-24 bg-[#1b1b1f]/40 border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c8bfff]">
            Deep Technical Engineering
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#e3e2e6] tracking-tight">
            Multi-Tier Architecture Built for 100% Offline Reliability
          </h2>
          <p className="text-sm sm:text-base text-[#c9c4d3] leading-relaxed">
            Discover how presentation, mathematical scheduling, and native hardware integrate across clean, fault-tolerant boundaries.
          </p>
        </div>

        {/* 3-Tier Layer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`bg-[#1b1b1f] rounded-3xl p-6 sm:p-7 border ${tier.color} shadow-xl flex flex-col justify-between`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#292a2d] border border-white/5 flex items-center justify-center">
                    {tier.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#928f9d] block">
                      {tier.level}
                    </span>
                    <h3 className="font-bold text-sm text-[#e3e2e6]">{tier.tech}</h3>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  {tier.responsibilities.map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[#c9c4d3]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c8bfff] shrink-0 mt-1.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Matrix Table */}
        <div className="bg-[#1b1b1f] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 space-y-1">
            <h3 className="text-xl font-bold text-[#e3e2e6]">
              Standard Mobile Clock Apps vs. iAlarm
            </h3>
            <p className="text-xs sm:text-sm text-[#928f9d]">
              Why interval schedules demand a dedicated mathematical cadence engine.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[#928f9d] uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Capability</th>
                  <th className="py-3 px-4 text-[#ff7d7d]">Standard Clock Apps</th>
                  <th className="py-3 px-4 text-[#40e17e]">iAlarm (Interval Alarm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#c9c4d3]">
                {comparisons.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#e3e2e6] whitespace-nowrap">
                      {row.criterion}
                    </td>
                    <td className="py-3.5 px-4 text-[#ff9999]/90 flex items-start gap-2">
                      <X className="w-4 h-4 text-[#ff5c5c] shrink-0 mt-0.5" />
                      <span>{row.standard}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#e3e2e6]">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#40e17e] shrink-0 mt-0.5" />
                        <span>{row.ialarm}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
