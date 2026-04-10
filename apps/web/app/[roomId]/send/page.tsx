"use client";

import { Footer } from "@/components/Footer";
import { TransferSessionCard } from "@/components/TransferSessionCard";
import { useTransferSession } from "@/hooks/useTransferSession";
import { useFileTransferStore } from "@/store/fileTransferStore";
import { formatETA, formatFileSize } from "@/utils";
import { CheckCircle2, FileText, Send, X, XCircle } from "lucide-react";
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
  const { goHome, hasFailures, isTransferComplete, redirectCountdown } =
    useTransferSession();

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
    if (!roomId) return;

    try {
      await navigator.clipboard.writeText(roomId);
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
          </nav>

          <main className="flex flex-1 flex-col items-center px-6 pt-6 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
            <TransferSessionCard
              title={isTransferComplete ? "Files sent" : "Sending files"}
              description={
                isTransferComplete
                  ? hasFailures
                    ? "The transfer finished with some errors. You will return home automatically shortly."
                    : "All selected files reached the receiver. You will return home automatically shortly."
                  : "Keep this page open until every file finishes transferring. Leaving now will stop the active transfer."
              }
              isComplete={isTransferComplete}
              redirectCountdown={redirectCountdown}
              roomId={roomId}
              hasCopiedRoomId={showRoomIdTooltip}
              onGoHome={goHome}
              onCopyRoomId={handleCopyRoomId}
              onShowQr={() => setShowQr(true)}
            />

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
                    <span className="text-white">{roomId}</span>
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
