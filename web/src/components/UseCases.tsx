import { Pill, Droplets, Moon, Utensils, Clock, CheckCircle2 } from "lucide-react";

export function UseCases() {
  const personas = [
    {
      icon: <Pill className="w-5 h-5 text-[#c8bfff]" />,
      title: "Medication Adherence",
      target: "Patients, Chronic Illness, Post-Op",
      schedule: "Start 06:00 AM • Every 6 Hours • 4 Occurrences (Daily)",
      description:
        "Ensures critical antibiotic or prescription intervals trigger on time without requiring 4 separate alarms to be manually tracked and adjusted.",
      benefit: "Guaranteed adherence across days",
    },
    {
      icon: <Droplets className="w-5 h-5 text-[#40e17e]" />,
      title: "Hydration & Desk Ergonomics",
      target: "Knowledge Workers & Developers",
      schedule: "Start 09:00 AM • Every 45 Minutes • 10 Occurrences (Weekdays)",
      description:
        "Automatic cadence throughout the workday that pauses in the evening and weekends without manual intervention.",
      benefit: "Halts automatically after work hours",
    },
    {
      icon: <Moon className="w-5 h-5 text-[#c8bfff]" />,
      title: "Shift Work & Polyphasic Sleep",
      target: "Healthcare Nurses, Night Shift Staff",
      schedule: "Start 02:00 PM • 90-Minute Sleep Cycles • 3 Occurrences",
      description:
        "Adaptable anchor times designed for rotating shifts. Setting an anchor dynamically adapts all downstream wakeup triggers.",
      benefit: "Adapts to irregular sleep schedules",
    },
    {
      icon: <Utensils className="w-5 h-5 text-[#40e17e]" />,
      title: "Intermittent Fasting & Nutrition",
      target: "Athletes, Fitness, Nutrition Plans",
      schedule: "Start 12:00 PM • Every 2 Hours • 4 Check-ins (One-Time)",
      description:
        "Structure meals and electrolyte intake across a defined 16:8 feeding window with visual progress tracking.",
      benefit: "Clear visual feeding timeline",
    },
  ];

  return (
    <section className="py-24 bg-[#121316] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c8bfff]">
            Real-World Application
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#e3e2e6] tracking-tight">
            Engineered for Precision Human Cadences
          </h2>
          <p className="text-sm sm:text-base text-[#c9c4d3] leading-relaxed">
            See how iAlarm streamlines timing across health protocols, workplace productivity, and non-standard schedules.
          </p>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {personas.map((p, idx) => (
            <div
              key={idx}
              className="bg-[#1b1b1f] border border-white/5 hover:border-white/15 rounded-3xl p-7 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#292a2d] border border-white/5 flex items-center justify-center">
                      {p.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#e3e2e6] group-hover:text-white transition-colors">
                        {p.title}
                      </h3>
                      <span className="text-[11px] text-[#928f9d]">{p.target}</span>
                    </div>
                  </div>
                </div>

                {/* Cadence Tag */}
                <div className="p-2.5 rounded-xl bg-[#292a2d]/70 border border-white/5 text-xs font-mono text-[#c8bfff] flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#40e17e]" />
                  <span>{p.schedule}</span>
                </div>

                <p className="text-xs sm:text-sm text-[#c9c4d3] leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-2 text-xs font-semibold text-[#40e17e]">
                <CheckCircle2 className="w-4 h-4" />
                <span>{p.benefit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
