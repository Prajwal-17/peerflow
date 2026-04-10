"use client";

import { Footer } from "@/components/Footer";
import { useFileTransferStore } from "@/store/fileTransferStore";
import { formatETA, formatFileSize } from "@/utils";
import {
  CheckCircle2,
  Copy,
  FileText,
  QrCode,
  Send,
  User,
  Wifi,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

export default function SendPage() {
  const params = useParams();
  const roomId = params?.roomId as string | undefined;
  const [showQr, setShowQr] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [showRoomIdTooltip, setShowRoomIdTooltip] = useState(false);
  const hasShownCompletionToast = useRef(false);
  const roomTooltipTimeoutRef = useRef<number | null>(null);

  const fileTransferItems = useFileTransferStore(
    (state) => state.fileTransferItems,
  );

  useEffect(() => {
    setInviteLink(window.location.href);
  }, [roomId]);

  useEffect(() => {
    return () => {
      if (roomTooltipTimeoutRef.current) {
        window.clearTimeout(roomTooltipTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const isComplete =
      fileTransferItems.length > 0 &&
      fileTransferItems.every((file) => file.status === "success");

    if (isComplete && !hasShownCompletionToast.current) {
      toast.success("Files sent successfully", {
        id: "active-transfer",
        description:
          fileTransferItems.length === 1
            ? "The receiver has the file."
            : "The receiver has all selected files.",
      });
      hasShownCompletionToast.current = true;
    }

    if (!isComplete) {
      hasShownCompletionToast.current = false;
    }
  }, [fileTransferItems]);

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId || "25232");
      setShowRoomIdTooltip(true);

      if (roomTooltipTimeoutRef.current) {
        window.clearTimeout(roomTooltipTimeoutRef.current);
      }

      roomTooltipTimeoutRef.current = window.setTimeout(() => {
        setShowRoomIdTooltip(false);
      }, 1200);
    } catch {
      setShowRoomIdTooltip(false);
    }
  };

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
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <div className="border-accent text-accent flex h-9 w-9 items-center justify-center rounded-lg border-[1.5px] shadow-[0_0_12px_rgba(0,229,160,0.3)]">
                <Send size={20} />
              </div>
              <span className="text-[20px] font-bold tracking-[0.04em] text-white">
                Peerflow
              </span>
            </Link>

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
                <div className="relative">
                  <button
                    onClick={handleCopyRoomId}
                    className="cursor-pointer transition-colors hover:text-white"
                    aria-label="Copy room ID"
                  >
                    <Copy size={16} />
                  </button>
                  {showRoomIdTooltip && (
                    <div className="pointer-events-none absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 rounded-md border border-white/10 bg-surface px-2 py-1 font-mono text-[10px] tracking-[0.05em] text-white/75 shadow-lg">
                      Copied
                    </div>
                  )}
                </div>
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
                          {f.size > 0
                            ? Math.round((f.progressBytes / f.size) * 100)
                            : 0}
                          %
                        </span>
                      </div>

                      <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${f.size > 0 ? (f.progressBytes / f.size) * 100 : 0}%`,
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="bg-accent relative h-full rounded-full shadow-[0_0_10px_rgba(0,229,160,0.5)]"
                        />
                      </div>

                      <div className="text-muted flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10.5px] leading-none">
                        <span>
                          {formatFileSize(f.progressBytes)} /{" "}
                          {formatFileSize(f.size)}
                        </span>
                        {f.progressBytes > 0 &&
                          f.status !== "success" &&
                          f.status !== "failed" && (
                            <>
                              <span> {formatFileSize(f.speed)} /s</span>
                              <span>~{formatETA(f.eta)} </span>
                            </>
                          )}
                      </div>
                    </div>

                    <div className="ml-2 flex flex-col items-end justify-center sm:ml-3">
                      {f.status === "success" && (
                        <div className="text-accent bg-accent/10 border-accent/20 flex h-7 w-7 items-center justify-center rounded-full border">
                          <CheckCircle2 size={14} />
                        </div>
                      )}
                      {f.status === "failed" && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10 text-red-400">
                          <X size={14} />
                        </div>
                      )}
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

          <Footer />
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
                    <span className="inline-flex items-center gap-2 text-white">
                      <span>{roomId || "25232"}</span>
                      <span className="relative inline-flex">
                        <button
                          onClick={handleCopyRoomId}
                          className="cursor-pointer text-white/55 transition-colors hover:text-white"
                          aria-label="Copy room ID"
                        >
                          <Copy size={14} />
                        </button>
                        {showRoomIdTooltip && (
                          <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 rounded-md border border-white/10 bg-surface px-2 py-1 font-mono text-[10px] tracking-[0.05em] whitespace-nowrap text-white/75 shadow-lg">
                            Copied
                          </span>
                        )}
                      </span>
                    </span>
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
