"use client";

import { peerSession } from "@/lib/peerSession";
import { useTransferSession } from "@/hooks/useTransferSession";
import { useFileTransferStore } from "@/store/fileTransferStore";
import { formatETA, formatFileSize } from "@/utils";
import { CTRL_CH_EVENT } from "@repo/types";
import {
  Check,
  CheckCircle2,
  Copy,
  FileText,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { TransferSessionCard } from "./TransferSessionCard";

export default function TransferView({ roomId }: { roomId: string }) {
  const [showQr, setShowQr] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [hasCopiedRoomId, setHasCopiedRoomId] = useState(false);
  const roomTooltipTimeoutRef = useRef<number | null>(null);
  const { goHome, hasFailures, isTransferComplete, redirectCountdown } =
    useTransferSession();

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

  const showIncomingBanner = useFileTransferStore(
    (state) => state.showIncomingBanner,
  );
  const setShowIncomingBanner = useFileTransferStore(
    (state) => state.setShowIncomingBanner,
  );
  const fileTransferItems = useFileTransferStore(
    (state) => state.fileTransferItems,
  );
  const currFile = useFileTransferStore((state) => state.currFile);

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setHasCopiedRoomId(true);

      if (roomTooltipTimeoutRef.current) {
        window.clearTimeout(roomTooltipTimeoutRef.current);
      }

      roomTooltipTimeoutRef.current = window.setTimeout(() => {
        setHasCopiedRoomId(false);
      }, 1200);
    } catch {
      setHasCopiedRoomId(false);
    }
  };

  const handleAccept = async () => {
    const dirHandler = await window.showDirectoryPicker({
      mode: "readwrite",
      startIn: "downloads",
    });

    peerSession.setDirHandler(dirHandler);

    if (!currFile) {
      console.log("no curr file");
      return;
    }

    const fileHandler = await dirHandler.getFileHandle(currFile?.name, {
      create: true,
    });
    peerSession.setfileHandler(fileHandler);

    const writable = await fileHandler.createWritable();
    peerSession.setWritableStream(writable);

    peerSession.ctrlChannel?.send(
      JSON.stringify({
        type: CTRL_CH_EVENT.TRANSFER_START,
      }),
    );
  };

  return (
    <>
      <main className="flex flex-1 flex-col items-center px-6 pt-6 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
        <TransferSessionCard
          title={isTransferComplete ? "Files received" : "Receiving files"}
          description={
            isTransferComplete
              ? hasFailures
                ? "The transfer finished with some errors. You will return home automatically shortly."
                : "Everything selected by the sender has been saved. You will return home automatically shortly."
              : "Keep this page open while files are being written to your device. Leaving now will stop the active transfer."
          }
          isComplete={isTransferComplete}
          redirectCountdown={redirectCountdown}
          roomId={roomId}
          hasCopiedRoomId={hasCopiedRoomId}
          onGoHome={goHome}
          onCopyRoomId={handleCopyRoomId}
          onShowQr={() => setShowQr(true)}
        />

        <AnimatePresence>
          {showIncomingBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="w-full max-w-3xl overflow-hidden"
            >
              <div className="border-accent/30 bg-accent/10 flex flex-col items-center justify-between gap-4 rounded-xl border p-4 shadow-[0_4px_20px_rgba(0,229,160,0.1)] sm:flex-row sm:px-6">
                <div className="flex items-center gap-4">
                  <div className="text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/40">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-white">
                      Incoming files request
                    </p>
                    <p className="mt-0.5 text-[12px] text-white/60">
                      Review the files below and confirm to receive.
                    </p>
                  </div>
                </div>
                <div className="flex w-full items-center gap-3 sm:w-auto">
                  <button
                    onClick={() => setShowIncomingBanner(false)}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-black/40 px-4 py-2 text-[13px] font-medium tracking-wide text-white transition-colors hover:bg-black/60 sm:flex-none"
                  >
                    <X size={16} className="text-red-400" /> Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowIncomingBanner(false);
                      handleAccept();
                    }}
                    className="bg-accent text-accent-foreground flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-bold tracking-wide shadow-[0_0_15px_rgba(0,229,160,0.2)] transition-all hover:shadow-[0_0_25px_rgba(0,229,160,0.4)] sm:flex-none"
                  >
                    <Check size={16} /> Accept
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    <span>{roomId}</span>
                    <button
                      onClick={handleCopyRoomId}
                      className="cursor-pointer text-white/55 transition-colors hover:text-white"
                      aria-label="Copy room ID"
                    >
                      <Copy size={14} />
                    </button>
                  </span>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
