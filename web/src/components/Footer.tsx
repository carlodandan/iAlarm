import { ArrowUp } from "lucide-react";
import { GithubIcon } from "./GithubIcon";
import intervalAlarmLogo from "../assets/interval_alarm_logo.svg";

const currentYear = new Date().getFullYear();

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#121316] border-t border-white/10 pt-16 pb-12 relative text-xs text-[#928f9d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/5">
          {/* Brand Info (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1b1b1f] border border-white/10 p-1.5 flex items-center justify-center">
                <img
                  src={intervalAlarmLogo}
                  alt="iAlarm Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-[#e3e2e6] tracking-tight">
                  iAlarm
                </span>
                <span className="text-[10px] uppercase font-semibold text-[#c8bfff] tracking-widest">
                  Interval Alarm
                </span>
              </div>
            </div>

            <p className="text-xs text-[#c9c4d3] max-w-sm leading-relaxed">
              Atomic, offline-first Android interval alarm utility with zero background battery drain. Powered by native Android AlarmManager, Rust scheduling logic, and Circadian Luxury aesthetics.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] font-mono text-[#928f9d]">
                Package: <span className="text-[#c8bfff]">com.intervalalarm.alarm</span>
              </span>
            </div>
          </div>

          {/* Quick Links (7 cols) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#e3e2e6] uppercase tracking-wider block">
                Product
              </span>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="hover:text-[#c8bfff] transition-colors">
                    Core Features
                  </a>
                </li>
                <li>
                  <a href="#calculator" className="hover:text-[#c8bfff] transition-colors">
                    Cadence Calculator
                  </a>
                </li>
                <li>
                  <a href="#showcase" className="hover:text-[#c8bfff] transition-colors">
                    App Showcase
                  </a>
                </li>
                <li>
                  <a href="#ringtones" className="hover:text-[#c8bfff] transition-colors">
                    12 Ringtone Presets
                  </a>
                </li>
                <li>
                  <a href="#download" className="hover:text-[#c8bfff] transition-colors">
                    Download APK
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-[#e3e2e6] uppercase tracking-wider block">
                Technical Docs
              </span>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/carlodandan/iAlarm/blob/main/docs/architecture.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#c8bfff] transition-colors"
                  >
                    Architecture
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/carlodandan/iAlarm/blob/main/docs/system.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#c8bfff] transition-colors"
                  >
                    System &amp; Permissions
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/carlodandan/iAlarm/blob/main/docs/product.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#c8bfff] transition-colors"
                  >
                    Product Specs
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/carlodandan/iAlarm/blob/main/docs/design.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#c8bfff] transition-colors"
                  >
                    Design Guidelines
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/carlodandan/iAlarm/blob/main/CHANGELOG.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#c8bfff] transition-colors"
                  >
                    Changelog (v{import.meta.env.VITE_APP_VERSION})
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-[#e3e2e6] uppercase tracking-wider block">
                Community
              </span>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/carlodandan/iAlarm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#c8bfff] transition-colors flex items-center gap-1.5"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>GitHub Repo</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/carlodandan/iAlarm/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#c8bfff] transition-colors"
                  >
                    Report Issues
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/carlodandan/iAlarm/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#c8bfff] transition-colors"
                  >
                    All Releases
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/carlodandan/iAlarm/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#c8bfff] transition-colors"
                  >
                    MIT License
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {currentYear} Carlo Dandan. Released under the MIT License.</p>
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1b1f] hover:bg-[#292a2d] text-[#e3e2e6] border border-white/5 transition-all active:scale-95 cursor-pointer"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5 text-[#c8bfff]" />
          </button>
        </div>
      </div>
    </footer>
  );
}
