"use client";

import { useFileTransferStore } from "@/store/fileTransferStore";
import {
  CheckCircle2,
  Copy,
  FileText,
  Link as LinkIcon,
  QrCode,
  Send,
  User,
  Wifi,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

export default function SendPage() {
  const params = useParams();
  const roomId = params?.roomId as string | undefined;
  const [dummyProgress] = useState(68);
  const [showQr, setShowQr] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const fileTransferItems = useFileTransferStore(
    (state) => state.fileTransferItems,
  );

  useEffect(() => {
    setInviteLink(`${window.location.origin}/${roomId || "25232"}`);
  }, [roomId]);

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

        <div className="z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col">
          <nav className="flex items-center justify-between border-b border-white/8 px-6 py-4 sm:px-8 sm:py-5">
            <div className="flex items-center gap-2.5">
              <div className="border-accent text-accent flex h-9 w-9 items-center justify-center rounded-lg border-[1.5px] shadow-[0_0_12px_rgba(0,229,160,0.3)]">
                <Send size={20} />
              </div>
              <span className="text-[20px] font-bold tracking-[0.04em] text-white">
                Peerflow
              </span>
            </div>

            <div className="text-accent flex items-center gap-2 font-mono text-xs tracking-[0.06em] uppercase">
              <Wifi size={18} />
              <span className="hidden sm:inline">Connected</span>
            </div>
          </nav>

          <main className="flex flex-1 flex-col items-center px-6 pt-6 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
            <div className="text-muted mb-6 flex flex-col items-center gap-4 font-mono text-sm sm:flex-row sm:gap-6">
              <div className="flex items-center gap-3">
                <span className="text-white">
                  Room ID - {roomId || "25232"}
                </span>
                <button className="cursor-pointer transition-colors hover:text-white">
                  <Copy size={16} />
                </button>
                <button className="cursor-pointer transition-colors hover:text-white">
                  <LinkIcon size={16} />
                </button>
              </div>
              <button
                onClick={() => setShowQr(true)}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-xs tracking-wider text-white uppercase transition-colors hover:bg-white/10"
              >
                Show Qr <QrCode size={16} />
              </button>
            </div>

            <div className="mb-8 flex w-full max-w-2xl items-center justify-center gap-8 sm:gap-16">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-lg font-medium text-white">
                  <User size={20} className="text-muted" /> You (Sender)
                </div>
                <span className="text-muted font-mono text-xs tracking-wider uppercase">
                  Sending
                </span>
              </div>

              <div className="text-muted relative flex w-24 items-center justify-center sm:w-32">
                <div className="absolute h-px w-full bg-white/20"></div>
                <div className="absolute -left-1 h-2 w-2 -rotate-45 transform border-t border-l border-white/40"></div>
                <div className="absolute -right-1 h-2 w-2 rotate-45 transform border-t border-r border-white/40"></div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-lg font-medium text-white">
                  <User size={20} className="text-muted" /> Receiver
                </div>
                <span className="text-muted font-mono text-xs tracking-wider uppercase">
                  Receiving
                </span>
              </div>
            </div>

            <div className="relative mb-6 w-full max-w-3xl rounded-xl border border-white/10 bg-[#111214]/50 p-4 shadow-2xl backdrop-blur-md sm:p-5">
              {fileTransferItems.map((f, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-lg border border-white/10 bg-black/40 p-3 transition-colors hover:border-white/20"
                >
                  <div className="flex items-start gap-3.5 sm:items-center">
                    <div className="text-muted mt-0.5 rounded-md bg-white/5 p-2.5 transition-colors group-hover:text-white/80 sm:mt-0">
                      <FileText size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between sm:gap-0">
                        <span className="truncate text-[14px] font-medium text-white">
                          {f.name}
                        </span>
                        <span className="font-mono text-[12px] leading-none text-white">
                          {dummyProgress}%
                        </span>
                      </div>

                      <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${dummyProgress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="bg-accent relative h-full rounded-full shadow-[0_0_10px_rgba(0,229,160,0.5)]"
                        />
                      </div>

                      <div className="text-muted flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10.5px] leading-none">
                        <span>4.2 MB / 5.0 MB</span>
                        <span>1.2 MB/s</span>
                        <span>~ 3sec left</span>
                      </div>
                    </div>

                    <div className="ml-2 flex flex-col items-end justify-center sm:ml-3">
                      <div className="text-accent bg-accent/10 border-accent/20 flex h-7 w-7 items-center justify-center rounded-full border">
                        <CheckCircle2 size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-6 text-sm sm:gap-12">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-accent flex items-center gap-2 font-medium">
                    <CheckCircle2 size={18} /> Total Success
                  </div>
                </div>

                <div className="h-8 w-px bg-white/10" />

                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 font-medium text-red-400">
                    <XCircle size={18} /> total Error
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-6 py-2.5 font-mono text-xs text-red-400 sm:text-sm">
                err msg
              </div>
            </div>
          </main>

          <footer className="mt-auto flex flex-col items-center justify-center gap-3 border-t border-white/8 p-5 text-center sm:flex-row sm:px-8 sm:py-5 sm:text-left">
            <div className="font-mono text-[11px] tracking-[0.06em] text-white/20">
              Built by <span className="text-accent">Prajwal-17</span>
            </div>
          </footer>
        </div>

        <AnimatePresence>
          {showQr && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQr(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative z-10 flex w-full max-w-sm flex-col items-center overflow-hidden rounded-2xl border border-white/10 bg-[#111214] shadow-2xl"
              >
                <div className="flex w-full items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
                  <h3 className="font-medium text-white">Room QR Code</h3>
                  <button
                    onClick={() => setShowQr(false)}
                    className="cursor-pointer text-white/50 transition-colors hover:text-white"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
                <div className="flex flex-col items-center p-8">
                  <div className="rounded-xl bg-white p-4 shadow-[0_0_30px_rgba(0,229,160,0.2)]">
                    <QRCode
                      value={inviteLink || "https://peerflow.com/"}
                      size={200}
                      level="H"
                      className="h-auto w-full max-w-50"
                    />
                  </div>
                  <p className="mt-6 text-center font-mono text-sm leading-relaxed text-white/50">
                    Scan this QR code with your mobile device to join room{" "}
                    <span className="text-white">{roomId || "25232"}</span>
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
