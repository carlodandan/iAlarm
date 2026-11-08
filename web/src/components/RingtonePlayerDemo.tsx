import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Disc3 } from "lucide-react";

import bestAndroidAudio from "../assets/ringtones/best_android_rington.ogg";
import dandadanAudio from "../assets/ringtones/dandadan_01.ogg";
import detectiveConanAudio from "../assets/ringtones/detective_conan_01.ogg";
import gintamaAudio from "../assets/ringtones/gintama_01.ogg";
import jujutsuKaisenAudio from "../assets/ringtones/jujutsu_kaisen_01.ogg";
import miRemixAudio from "../assets/ringtones/mi_remix_miui12.ogg";
import nokiaAndroidAudio from "../assets/ringtones/nokia_android.ogg";
import onePiece01Audio from "../assets/ringtones/one_piece_01.ogg";
import onePiece02Audio from "../assets/ringtones/one_piece_02.ogg";
import onePiece03Audio from "../assets/ringtones/one_piece_03.ogg";
import oppoCalmAudio from "../assets/ringtones/oppo_calm.ogg";
import samsungGalaxyAudio from "../assets/ringtones/samsung_galaxy_s11.ogg";

interface RingtoneItem {
  id: string;
  name: string;
  tag: string;
  genre: string;
  audioSrc: string;
}

const ringtones: RingtoneItem[] = [
  {
    id: "best_android_rington",
    name: "Best Android",
    tag: "Global Default",
    genre: "Modern Electro Chime",
    audioSrc: bestAndroidAudio,
  },
  {
    id: "one_piece_01",
    name: "One Piece 1",
    tag: "Anime Fanfare",
    genre: "Grand Adventure Theme",
    audioSrc: onePiece01Audio,
  },
  {
    id: "one_piece_02",
    name: "One Piece 2",
    tag: "Adventure Call",
    genre: "Heroic Journey Motif",
    audioSrc: onePiece02Audio,
  },
  {
    id: "one_piece_03",
    name: "One Piece 3",
    tag: "Voyage Pulse",
    genre: "Lively Pirate Rhythm",
    audioSrc: onePiece03Audio,
  },
  {
    id: "jujutsu_kaisen_01",
    name: "Jujutsu Kaisen",
    tag: "High Tempo",
    genre: "Battle Rhythm Drive",
    audioSrc: jujutsuKaisenAudio,
  },
  {
    id: "dandadan_01",
    name: "Dandadan",
    tag: "Psychedelic",
    genre: "High-Energy Anime Beat",
    audioSrc: dandadanAudio,
  },
  {
    id: "detective_conan_01",
    name: "Detective Conan",
    tag: "Classic Mystery",
    genre: "Suspense Brass Sax Theme",
    audioSrc: detectiveConanAudio,
  },
  {
    id: "gintama_01",
    name: "Gintama",
    tag: "Retro Spirit",
    genre: "Energetic Anime Cadence",
    audioSrc: gintamaAudio,
  },
  {
    id: "nokia_android",
    name: "Nokia Android",
    tag: "Nostalgic",
    genre: "Refined Modern Arpeggio",
    audioSrc: nokiaAndroidAudio,
  },
  {
    id: "oppo_calm",
    name: "Oppo Calm",
    tag: "Ambient Rest",
    genre: "Gentle Zen Wake Bell",
    audioSrc: oppoCalmAudio,
  },
  {
    id: "samsung_galaxy_s11",
    name: "Samsung Galaxy S11",
    tag: "OEM Favorite",
    genre: "Refined Classic Horizon",
    audioSrc: samsungGalaxyAudio,
  },
  {
    id: "mi_remix_miui12",
    name: "Mi Remix (MIUI 12)",
    tag: "Rhythmic Pulse",
    genre: "Dynamic Smartphone Groove",
    audioSrc: miRemixAudio,
  },
];

export function RingtonePlayerDemo() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop playback when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const handleTogglePlay = (id: string, audioSrc: string) => {
    // If clicking on currently playing tone, pause & reset it
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setPlayingId(null);
      return;
    }

    // Stop currently active tone if any
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    try {
      const audio = new Audio(audioSrc);
      audio.volume = 0.85;
      audioRef.current = audio;
      setPlayingId(id);

      audio.onended = () => {
        setPlayingId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingId(null);
        audioRef.current = null;
      };

      audio.play().catch(() => {
        setPlayingId(null);
        audioRef.current = null;
      });
    } catch {
      setPlayingId(null);
      audioRef.current = null;
    }
  };

  return (
    <section id="ringtones" className="py-24 bg-[#121316] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c8bfff]">
            Auditory Experience
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#e3e2e6] tracking-tight">
            12 Bundled High-Fidelity Custom Tones
          </h2>
          <p className="text-sm sm:text-base text-[#c9c4d3] leading-relaxed">
            Shipped directly in native APK raw resources (<code className="text-[#c8bfff] font-mono">res/raw/</code>). Wakes you reliably with synchronized haptic motor pulses, zero reliance on external streaming. Tap any track below to audition the real soundtrack.
          </p>
        </div>

        {/* Ringtone Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ringtones.map((tone) => {
            const isPlaying = playingId === tone.id;
            return (
              <div
                key={tone.id}
                onClick={() => handleTogglePlay(tone.id, tone.audioSrc)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
                  isPlaying
                    ? "bg-[#292a2d] border-[#c8bfff] shadow-lg shadow-[#c8bfff]/10 ring-1 ring-[#c8bfff]/40"
                    : "bg-[#1b1b1f] border-white/5 hover:border-white/15 hover:bg-[#202126]"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#928f9d] bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                      {tone.tag}
                    </span>
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isPlaying
                          ? "bg-[#c8bfff] text-[#121316] scale-110"
                          : "bg-[#292a2d] text-[#c9c4d3] group-hover:text-white group-hover:bg-[#343538]"
                      }`}
                      aria-label={isPlaying ? `Stop ${tone.name}` : `Preview ${tone.name}`}
                    >
                      {isPlaying ? (
                        <VolumeX className="w-4 h-4 text-[#ff5c5c]" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[#e3e2e6] group-hover:text-white transition-colors">
                      {tone.name}
                    </h3>
                    <span className="text-xs text-[#928f9d]">{tone.genre}</span>
                  </div>
                </div>

                {/* Animated Equalizer Wave when playing */}
                <div className="pt-4 flex items-center justify-between text-[11px] text-[#928f9d]">
                  <span className="font-mono text-[10px]">
                    {isPlaying ? "Playing Track..." : "Tap to Audition"}
                  </span>
                  {isPlaying ? (
                    <div className="flex items-end gap-1 h-3">
                      <span className="w-1 bg-[#c8bfff] h-3 animate-pulse" />
                      <span className="w-1 bg-[#40e17e] h-2 animate-bounce" />
                      <span className="w-1 bg-[#c8bfff] h-3.5 animate-pulse" />
                      <span className="w-1 bg-[#40e17e] h-1.5 animate-ping" />
                    </div>
                  ) : (
                    <Disc3 className="w-3.5 h-3.5 text-[#928f9d] group-hover:text-[#c8bfff] transition-colors" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
