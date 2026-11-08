import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Does iAlarm ring when my phone is locked and asleep?",
      a: "Yes. All occurrences are scheduled directly with the native Android AlarmManager using the high-priority setAlarmClock() API. When an occurrence triggers, AlarmReceiver acquires a SCREEN_BRIGHT_WAKE_LOCK to turn the display on and launches AlarmRingingActivity directly over the lock-screen.",
    },
    {
      q: "Does iAlarm work completely offline without internet?",
      a: "Yes. iAlarm is 100% offline-first. There are no tracking scripts, no cloud logins, and no remote dependencies. The entire deterministic scheduling engine runs locally in compiled Rust, and all 12 custom ringtones are stored natively in the app.",
    },
    {
      q: "How does iAlarm bypass Android Doze mode and aggressive battery killers?",
      a: "Android treats setAlarmClock() as an explicit user-configured alarm clock event. By specification, the operating system exempts AlarmClock instances from Doze mode idle limits. Furthermore, the Settings diagnostics panel provides quick links to exempt the app from OEM battery optimizations.",
    },
    {
      q: "What happens if my phone runs out of battery or reboots?",
      a: "iAlarm registers a native BootReceiver (RECEIVE_BOOT_COMPLETED). When your device finishes restarting, the engine reads your persisted routines, evaluates current time, skips stale past occurrences, and cleanly registers the next upcoming future occurrence.",
    },
    {
      q: "What does 'Isolated Progression Ladder' mean?",
      a: "In standard alarm apps, snoozing can cause overlapping alarms. In iAlarm, snoozing or skipping a single occurrence creates an isolated temporary event without shifting the master cadence grid. Subsequent occurrences continue to trigger strictly according to your original anchor start time.",
    },
    {
      q: "Is iAlarm free and open-source?",
      a: "Yes! iAlarm is fully open-source under the MIT license. You can inspect the source code, verify privacy and security, or build custom APKs from the public GitHub repository.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-[#121316] relative border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-3 mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c8bfff]">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#e3e2e6] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-[#c9c4d3]">
            Everything you need to know about iAlarm's native Android interval orchestration.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#1b1b1f] border border-white/5 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-sm sm:text-base text-[#e3e2e6]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#c8bfff] transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#c9c4d3] leading-relaxed border-t border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
