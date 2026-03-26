"use client";

import { featurePills, steps } from "@/constants";
import { Archive, Cast, Download, MonitorUp, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function HomePage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <style>{`
        @keyframes pulse-custom {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          opacity: 0;
          animation: fadeUp 0.6s ease forwards;
        }
        .animate-pulse-custom {
          animation: pulse-custom 2s infinite;
        }
      `}</style>

      <div className="bg-background text-foreground relative flex min-h-screen flex-col overflow-x-hidden font-sans">
        {/* grids and glows */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="pointer-events-none fixed -top-50 -right-50 z-0 h-175 w-175 rounded-full bg-[radial-gradient(circle,rgba(0,229,160,0.06)_0%,transparent_70%)]" />
        <div className="pointer-events-none fixed -bottom-25 -left-25 z-0 h-125 w-125 rounded-full bg-[radial-gradient(circle,rgba(0,100,255,0.04)_0%,transparent_70%)]" />

        <div className="z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col">
          {/* nav */}
          <nav className="flex items-center justify-between border-b border-white/8 px-6 py-4 sm:px-8 sm:py-5">
            <div className="flex items-center gap-2.5">
              <div className="border-accent text-accent flex h-9 w-9 items-center justify-center rounded-lg border-[1.5px] shadow-[0_0_12px_rgba(0,229,160,0.3)]">
                <Send className="" size={20} />
              </div>
              <span className="text-[20px] font-bold tracking-[0.04em] text-white">
                Peerflow
              </span>
            </div>

            <div className="flex items-center gap-5 sm:gap-8">
              <div className="text-muted hover:text-foreground flex cursor-pointer items-center gap-2 font-mono text-xs tracking-[0.06em] uppercase transition-colors duration-200">
                <Archive size={18} />
                <span className="hidden sm:inline">Saved Items</span>
                <span className="sm:hidden">Saved</span>
              </div>
              <div className="text-muted hover:text-foreground flex cursor-pointer items-center gap-2 font-mono text-xs tracking-[0.06em] uppercase transition-colors duration-200">
                <Cast size={22} />
                <span className="hidden sm:inline">Nearby devices</span>
                <span className="sm:hidden">Nearby</span>
              </div>
            </div>
          </nav>

          <main className="flex flex-1 flex-col items-center justify-center px-6 pt-10 pb-8 text-center sm:px-8 sm:pt-14 sm:pb-12">
            <h1
              className="animate-fade-up mb-4 text-[clamp(44px,6vw,76px)] leading-none font-extrabold tracking-[-0.03em] text-white"
              style={{ animationDelay: "0.2s" }}
            >
              Share files
              <br />
              <span className="text-accent relative">instantly.</span>
            </h1>

            <p
              className="animate-fade-up text-muted mb-10 max-w-130 text-[16px] leading-[1.6] font-normal"
              style={{ animationDelay: "0.3s" }}
            >
              Direct device to device transfer over WebRTC & UDP. No middlemen,
              no cloud, no limits — just fast, private, peer to peer file
              sharing.
            </p>

            {/* CTA */}
            <div
              className="animate-fade-up flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="relative z-50 w-full sm:w-auto" ref={dropdownRef}>
                <button
                  className="bg-accent flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border-none px-7 py-3.5 font-sans text-[15px] font-bold tracking-[0.04em] text-black shadow-[0_0_24px_rgba(0,229,160,0.3)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_32px_rgba(0,229,160,0.3)] sm:w-auto sm:justify-start"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Send size={18} />
                  Send a file
                  <div
                    className={`ml-0.5 h-1.5 w-1.5 border-r-2 border-b-2 border-black transition-transform duration-200 ${
                      isDropdownOpen ? "-rotate-135" : "rotate-45"
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-[calc(100%+10px)] left-0 z-50 w-full min-w-56 overflow-hidden rounded-xl border border-white/20 bg-zinc-950 shadow-[0_16px_40px_rgba(0,0,0,0.8)] sm:w-auto">
                    <button
                      className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-4.5 py-4 text-left font-sans text-[15px] font-medium tracking-[0.02em] text-white transition-colors duration-150 hover:bg-white/10"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
                        <MonitorUp size={18} />
                      </span>
                      <span className="whitespace-nowrap">
                        Choose from device
                      </span>
                    </button>
                    <div className="h-px bg-white/10" />
                    <button
                      className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-4.5 py-4 text-left font-sans text-[15px] font-medium tracking-[0.02em] text-white transition-colors duration-150 hover:bg-white/10"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
                        <Archive size={18} />
                      </span>
                      <span className="whitespace-nowrap">Saved items</span>
                    </button>
                  </div>
                )}
              </div>

              <button className="text-foreground flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-white/8 bg-transparent px-7 py-3.25 font-sans text-[15px] font-semibold tracking-[0.04em] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/4 sm:w-auto sm:justify-start">
                <Download size={16} />
                Receive
              </button>
            </div>

            <div
              className="animate-fade-up mt-10 flex flex-wrap justify-center gap-2.5"
              style={{ animationDelay: "0.5s" }}
            >
              {featurePills.map((f) => (
                <div
                  key={f}
                  className="text-muted hover:text-foreground flex items-center gap-1.75 rounded-full border border-white/8 bg-white/3 px-3.5 py-1.5 font-mono text-[11px] tracking-[0.08em] uppercase transition-colors duration-200 hover:border-white/18"
                >
                  <div className="bg-accent h-1.25 w-1.25 shrink-0 rounded-full" />
                  {f}
                </div>
              ))}
            </div>
          </main>

          {/* steps */}
          <section className="flex flex-wrap justify-center gap-0 px-6 pb-12 sm:flex-nowrap sm:px-8 sm:pb-16">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className={`animate-fade-up relative flex w-1/2 flex-col items-center p-4 text-center sm:w-auto sm:px-8 sm:py-0 ${
                  idx !== 2
                    ? "sm:after:absolute sm:after:top-5.5 sm:after:right-0 sm:after:h-10 sm:after:w-px sm:after:bg-white/8"
                    : ""
                }`}
                style={{ animationDelay: s.delay }}
              >
                <div className="text-accent mb-2.5 font-mono text-[11px] tracking-[0.12em] uppercase">
                  {s.id}
                </div>
                <div className="mb-1.5 text-[15px] font-bold tracking-[0.01em] text-white">
                  {s.title}
                </div>
                <div className="text-muted max-w-35 font-mono text-[12px] leading-[1.6]">
                  {s.desc}
                </div>
              </div>
            ))}
          </section>

          {/* footer */}
          <footer className="flex flex-col items-center justify-center gap-3 border-t border-white/8 p-5 text-center sm:flex-row sm:px-8 sm:py-5 sm:text-left">
            <div className="font-mono text-[11px] tracking-[0.06em] text-white/20">
              Built by <span className="text-accent">Prajwal-17</span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
