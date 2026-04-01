"use client";

import { useFileTransferStore } from "@/store/fileTransferStore";
import {
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Link as LinkIcon,
  QrCode,
  User,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

export default function TransferView({ roomId }: { roomId: string }) {
  const [dummyProgress] = useState(68);
  const [showQr, setShowQr] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const showIncomingBanner = useFileTransferStore(
    (state) => state.showIncomingBanner,
  );
  const setShowIncomingBanner = useFileTransferStore(
    (state) => state.setShowIncomingBanner,
  );

  const fileTransferItems = useFileTransferStore(
    (state) => state.fileTransferItems,
  );

  useEffect(() => {
    console.log("items", fileTransferItems);
  }, [fileTransferItems]);

  return (
    <>
      <main className="flex flex-1 flex-col items-center px-6 pt-6 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
        {/* Room Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-muted mb-6 flex flex-col items-center gap-4 font-mono text-sm sm:flex-row sm:gap-6"
        >
          <div className="flex items-center gap-3">
            <span className="text-white">Room ID — {roomId}</span>
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
        </motion.div>

        {/* Peers */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
          className="mb-8 flex w-full max-w-2xl items-center justify-center gap-8 sm:gap-16"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-lg font-medium text-white">
              <User size={20} className="text-muted" /> You | (name)
            </div>
            <span className="text-muted font-mono text-xs tracking-wider uppercase">
              Sending
            </span>
          </div>

          <div className="text-muted relative flex w-24 items-center justify-center sm:w-32">
            <div className="absolute h-px w-full bg-white/20" />
            <div className="absolute -left-1 h-2 w-2 -rotate-45 transform border-t border-l border-white/40" />
            <div className="absolute -right-1 h-2 w-2 rotate-45 transform border-t border-r border-white/40" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-lg font-medium text-white">
              <User size={20} className="text-muted" /> P2 | (name)
            </div>
            <span className="text-muted font-mono text-xs tracking-wider uppercase">
              Receiving
            </span>
          </div>
        </motion.div>

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
                    onClick={() => setShowIncomingBanner(false)}
                    className="bg-accent text-accent-foreground flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-bold tracking-wide shadow-[0_0_15px_rgba(0,229,160,0.2)] transition-all hover:shadow-[0_0_25px_rgba(0,229,160,0.4)] sm:flex-none"
                  >
                    <Check size={16} /> Accept
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* transfer list */}
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

                  {/* Progress Bar Container */}
                  <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dummyProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-accent relative h-full rounded-full shadow-[0_0_10px_rgba(0,229,160,0.5)]"
                    />
                  </div>

                  {/* Stats */}
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

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-6 text-sm sm:gap-12">
            <div className="flex flex-col items-center gap-1">
              <div className="text-accent flex items-center gap-2 font-medium">
                <CheckCircle2 size={18} /> Total Success
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 font-medium text-red-400">
                <XCircle size={18} /> Total Error
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-6 py-2.5 font-mono text-xs text-red-400 sm:text-sm">
            err msg
          </div>
        </motion.div>
      </main>

      {/* QR dialog */}
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
    </>
  );
}
