"use client";

import { Footer } from "@/components/Footer";
import { featurePills, steps } from "@/constants";
import useSignalling from "@/hooks/useSignalling";
import { useTransferSetup } from "@/hooks/useTransferSetup";
import { usePeerStore } from "@/store/peerStore";
import { PEER_TYPE } from "@repo/types";
import { Archive, Cast, Download, MonitorUp, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const setPeerType = usePeerStore((state) => state.setPeerType);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useSignalling();
  const {
    handleFilesSelected,
    handleChooseFromDevice,
    handleChooseSavedItems,
  } = useTransferSetup(dropdownRef, fileInputRef, setIsDropdownOpen);

  return (
    <>
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
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="mb-4 text-[clamp(44px,6vw,76px)] leading-none font-extrabold tracking-[-0.03em] text-white"
            >
              Share files
              <br />
              <span className="text-accent relative">instantly.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="text-muted mb-10 max-w-130 text-[16px] leading-[1.6] font-normal"
            >
              Direct device to device transfer over WebRTC & UDP. No middlemen,
              no cloud, no limits — just fast, private, peer to peer file
              sharing.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
              className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row"
            >
              <div className="relative z-50 w-full sm:w-auto" ref={dropdownRef}>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-accent flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border-none px-7 py-3.5 font-sans text-[15px] font-bold tracking-[0.04em] text-black shadow-[0_0_24px_rgba(0,229,160,0.3)] transition-all duration-150 hover:shadow-[0_4px_32px_rgba(0,229,160,0.3)] sm:w-auto sm:justify-start"
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setPeerType(PEER_TYPE.SEND);
                  }}
                >
                  <Send size={18} />
                  Send a file
                  <motion.div
                    animate={{ rotate: isDropdownOpen ? -135 : 45 }}
                    transition={{ ease: "easeInOut", duration: 0.2 }}
                    className="ml-0.5 h-1.5 w-1.5 border-r-2 border-b-2 border-black"
                  />
                </motion.button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute top-[calc(100%+8px)] left-0 z-50 w-full min-w-44 overflow-hidden rounded-lg border border-white/10 bg-[#111214] p-1.5 shadow-xl sm:w-auto"
                    >
                      <button
                        className="text-foreground flex w-full cursor-pointer items-center gap-2.5 rounded-md bg-transparent px-3 py-2 text-left font-sans text-sm font-medium tracking-[0.01em] transition-colors duration-150 hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleChooseFromDevice();
                        }}
                      >
                        <MonitorUp size={16} className="text-muted shrink-0" />
                        <span className="whitespace-nowrap">
                          Choose from device
                        </span>
                      </button>
                      <button
                        className="text-foreground flex w-full cursor-pointer items-center gap-2.5 rounded-md bg-transparent px-3 py-2 text-left font-sans text-sm font-medium tracking-[0.01em] transition-colors duration-150 hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleChooseSavedItems();
                        }}
                      >
                        <Archive size={16} className="text-muted shrink-0" />
                        <span className="whitespace-nowrap">Saved items</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFilesSelected}
                />
              </div>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="text-foreground flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-white/8 bg-transparent px-7 py-3.25 font-sans text-[15px] font-semibold tracking-[0.04em] transition-colors duration-200 hover:border-white/35 hover:bg-white/4 sm:w-auto sm:justify-start"
                onClick={() => {
                  setPeerType(PEER_TYPE.RECEIVE);
                  router.push("/enter/receive");
                }}
              >
                <Download size={16} />
                Receive
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
              className="mt-10 flex flex-wrap justify-center gap-2.5"
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
            </motion.div>
          </main>

          {/* steps */}
          <section className="flex flex-wrap justify-center gap-0 px-6 pb-12 sm:flex-nowrap sm:px-8 sm:pb-16">
            {steps.map((s, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.5 + idx * 0.1,
                  ease: "easeOut",
                }}
                className={`relative flex w-1/2 flex-col items-center p-4 text-center sm:w-auto sm:px-8 sm:py-0 ${
                  idx !== 2
                    ? "sm:after:absolute sm:after:top-5.5 sm:after:right-0 sm:after:h-10 sm:after:w-px sm:after:bg-white/8"
                    : ""
                }`}
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
              </motion.div>
            ))}
          </section>

          <Footer />
        </div>
      </div>
    </>
  );
}
