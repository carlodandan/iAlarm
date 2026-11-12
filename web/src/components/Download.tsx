import { Download as DownloadIcon, Smartphone, ShieldCheck } from "lucide-react";
import { GithubIcon } from "./GithubIcon";

export function Download() {
  return (
    <section id="download" className="py-24 bg-[#1b1b1f]/60 relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#40e17e]">
            Get iAlarm Today
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#e3e2e6] tracking-tight">
            Install on Your Android Device
          </h2>
          <p className="text-sm sm:text-base text-[#c9c4d3] leading-relaxed">
            Free and open-source under the MIT license. Zero trackers, zero cloud dependencies, and zero advertising.
          </p>
        </div>

        {/* Download Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Card 1: APK Release */}
          <div className="bg-[#1b1b1f] border border-[#c8bfff]/30 rounded-3xl p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#c8bfff]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#c8bfff]/15 text-[#c8bfff] flex items-center justify-center border border-[#c8bfff]/25">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#40e17e]/15 text-[#40e17e] border border-[#40e17e]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#40e17e] animate-pulse" />
                  Latest: v{import.meta.env.VITE_APP_VERSION}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#e3e2e6]">
                  Pre-Compiled Android APK
                </h3>
                <p className="text-xs text-[#928f9d] mt-1">
                  Ready to install directly on modern Android devices.
                </p>
              </div>

              <div className="space-y-2 text-xs text-[#c9c4d3]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#40e17e]" />
                  <span>Targets ARM64-v8a and Universal architecture</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#40e17e]" />
                  <span>Supports Android 7.0 through Android 15 (API 24–35)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#40e17e]" />
                  <span>Includes all 12 custom ringtones &amp; haptic chimes</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <a
                href="https://github.com/carlodandan/iAlarm/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-2xl bg-[#c8bfff] hover:bg-[#d8d1ff] text-[#121316] font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-[#c8bfff]/25 transition-all active:scale-[0.98]"
              >
                <DownloadIcon className="w-4 h-4" />
                <span>Download Latest APK (GitHub Releases)</span>
              </a>
              <span className="text-[11px] text-[#928f9d] text-center block mt-2">
                SHA-256 verified build artifact via GitHub Actions
              </span>
            </div>
          </div>

          {/* Card 2: Source Code & Build */}
          <div className="bg-[#1b1b1f] border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col justify-between group">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#292a2d] text-[#e3e2e6] flex items-center justify-center border border-white/10">
                  <GithubIcon className="w-6 h-6 text-[#c8bfff]" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 text-[#928f9d] border border-white/5">
                  MIT License
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#e3e2e6]">
                  Build From Source
                </h3>
                <p className="text-xs text-[#928f9d] mt-1">
                  Full access to React 19, Rust, and Kotlin source code.
                </p>
              </div>

              <div className="bg-[#121316] rounded-2xl p-3 border border-white/5 font-mono text-[11px] text-[#c9c4d3] space-y-1 overflow-x-auto">
                <div className="text-[#928f9d]"># Clone and build with pnpm</div>
                <div>git clone https://github.com/carlodandan/iAlarm.git</div>
                <div>cd iAlarm</div>
                <div>pnpm install</div>
                <div>pnpm tauri android build --apk</div>
              </div>
            </div>

            <div className="pt-8">
              <a
                href="https://github.com/carlodandan/iAlarm"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-2xl bg-[#292a2d] hover:bg-[#343538] text-[#e3e2e6] font-semibold text-sm flex items-center justify-center gap-2.5 border border-white/10 transition-all active:scale-[0.98]"
              >
                <GithubIcon className="w-4 h-4 text-[#c8bfff]" />
                <span>View Repository &amp; Documentation</span>
              </a>
              <span className="text-[11px] text-[#928f9d] text-center block mt-2">
                Contributions, issues, and PRs welcome
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
