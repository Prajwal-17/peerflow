"use client";

import { CheckCircle2, Copy, QrCode, TimerReset } from "lucide-react";

type TransferSessionCardProps = {
  title: string;
  description: string;
  isComplete: boolean;
  redirectCountdown: number | null;
  roomId?: string;
  hasCopiedRoomId?: boolean;
  onGoHome: () => void;
  onCopyRoomId?: () => void;
  onShowQr?: () => void;
};

export function TransferSessionCard({
  title,
  description,
  isComplete,
  redirectCountdown,
  roomId,
  hasCopiedRoomId = false,
  onGoHome,
  onCopyRoomId,
  onShowQr,
}: TransferSessionCardProps) {
  return (
    <div className="mb-8 w-full max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-md sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className={[
                "inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] uppercase",
                isComplete
                  ? "border-accent/30 bg-accent/12 text-accent"
                  : "border-amber-400/20 bg-amber-400/10 text-amber-200",
              ].join(" ")}
            >
              {isComplete ? "Transfer complete" : "Transfer in progress"}
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60 sm:text-[15px]">
              {description}
            </p>
          </div>

          {roomId && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-3">
              <div>
                <p className="text-[11px] font-medium tracking-[0.14em] text-white/45 uppercase">
                  Room ID
                </p>
                <p className="mt-1 font-mono text-sm text-white sm:text-base">
                  {roomId}
                </p>
              </div>
              {onCopyRoomId && (
                <button
                  onClick={onCopyRoomId}
                  className={[
                    "flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-colors",
                    hasCopiedRoomId
                      ? "border-accent/30 bg-accent/12 text-accent"
                      : "border-white/12 bg-black/30 text-white hover:bg-black/45",
                  ].join(" ")}
                >
                  <Copy size={16} />
                  {hasCopiedRoomId ? "Copied" : "Copy room ID"}
                </button>
              )}
            </div>
          )}

          {isComplete && redirectCountdown !== null && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-white/75">
              <TimerReset size={14} className="text-accent" />
              Redirecting home in {redirectCountdown}s
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onShowQr && (
            <button
              onClick={onShowQr}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/12 bg-black/30 px-3.5 py-2 text-sm text-white transition-colors hover:bg-black/45"
            >
              <QrCode size={16} />
              Show QR
            </button>
          )}
          {isComplete && (
            <button
              onClick={onGoHome}
              className="bg-accent text-accent-foreground flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors hover:brightness-110"
            >
              <CheckCircle2 size={16} />
              Go home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
