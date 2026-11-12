import { useState, useEffect } from "react";
import { Download, Menu, X } from "lucide-react";
import { GithubIcon } from "./GithubIcon";
import intervalAlarmLogo from "../assets/interval_alarm_logo.svg";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Cadence Calculator", href: "#calculator" },
    { label: "Showcase", href: "#showcase" },
    { label: "Ringtones", href: "#ringtones" },
    { label: "Architecture", href: "#architecture" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#121316]/85 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/40 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Title */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#1b1b1f] border border-white/10 p-1.5 shadow-md flex items-center justify-center group-hover:border-[#c8bfff]/50 transition-colors">
              <img
                src={intervalAlarmLogo}
                alt="iAlarm Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-[#e3e2e6] tracking-tight group-hover:text-white transition-colors">
                  iAlarm
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#40e17e]/15 text-[#40e17e] border border-[#40e17e]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#40e17e] animate-pulse" />
                  v{import.meta.env.VITE_APP_VERSION}
                </span>
              </div>
              <span className="text-[10px] text-[#928f9d] uppercase font-semibold tracking-widest hidden sm:block">
                Interval Alarm
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#1b1b1f]/80 border border-white/5 px-3 py-1.5 rounded-full">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-1 text-xs font-medium text-[#c9c4d3] hover:text-[#c8bfff] transition-colors rounded-full hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="https://github.com/carlodandan/iAlarm"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3.5 flex items-center gap-2 rounded-xl bg-[#1b1b1f] hover:bg-[#292a2d] text-[#e3e2e6] border border-white/10 text-xs font-semibold transition-all active:scale-95"
              title="View Source on GitHub"
            >
              <GithubIcon className="w-4 h-4 text-[#c8bfff]" />
              <span>GitHub</span>
            </a>
            <a
              href="https://github.com/carlodandan/iAlarm/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 flex items-center gap-2 rounded-xl bg-[#c8bfff] hover:bg-[#d8d1ff] text-[#121316] text-xs font-bold transition-all shadow-md shadow-[#c8bfff]/20 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download APK</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-[#1b1b1f] border border-white/10 flex items-center justify-center text-[#e3e2e6]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1b1b1f] border-b border-white/10 px-4 pt-3 pb-6 space-y-3 mt-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-[#c9c4d3] hover:text-[#c8bfff] hover:bg-white/5 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
            <a
              href="https://github.com/carlodandan/iAlarm/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 flex items-center justify-center gap-2 rounded-xl bg-[#c8bfff] text-[#121316] text-xs font-bold"
            >
              <Download className="w-4 h-4" />
              <span>Download Android APK</span>
            </a>
            <a
              href="https://github.com/carlodandan/iAlarm"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 flex items-center justify-center gap-2 rounded-xl bg-[#292a2d] text-[#e3e2e6] text-xs font-semibold border border-white/10"
            >
              <GithubIcon className="w-4 h-4 text-[#c8bfff]" />
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
