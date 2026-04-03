"use client";

import { Footer } from "@/components/Footer";
import RoomCodeEntry from "@/components/RoomCodeEntry";
import TransferView from "@/components/TransferView";
import useSignalling from "@/hooks/useSignalling";
import { peerSession } from "@/lib/peerSession";
import { usePeerStore } from "@/store/peerStore";
import { Send, Wifi } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function ReceivePage() {
  const params = useParams();
  const router = useRouter();
  useSignalling();
  const isConnected = usePeerStore((s) => s.isConnected);

  const paramRoomId = params?.roomId as string | undefined;
  const isEntry = !paramRoomId || paramRoomId === "enter"; // room entry state

  const [resolvedRoomId, setResolvedRoomId] = useState<string | null>(
    isEntry ? null : (paramRoomId ?? null),
  );

  useEffect(() => {
    if (!isEntry && paramRoomId) setResolvedRoomId(paramRoomId);
  }, [isEntry, paramRoomId]);

  const handleJoin = useCallback(
    (code: string) => {
      if (!isConnected) return;
      peerSession.setRoomId(code);
      usePeerStore.getState().setRoomId(code);
      peerSession.joinRoom();
      router.replace(`/${code}/receive`);
      setResolvedRoomId(code);
    },
    [router, isConnected],
  );

  const showEntry = resolvedRoomId === null;

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col overflow-x-hidden font-sans">
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

          {!showEntry && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-accent flex items-center gap-2 font-mono text-xs tracking-[0.06em] uppercase"
            >
              <Wifi size={18} />
              <span className="hidden sm:inline">Connected</span>
            </motion.div>
          )}
        </nav>

        <AnimatePresence mode="wait">
          {showEntry ? (
            <motion.div
              key="entry"
              className="flex flex-1 flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <RoomCodeEntry onJoin={handleJoin} />
            </motion.div>
          ) : (
            <motion.div
              key="transfer"
              className="flex flex-1 flex-col"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <TransferView roomId={resolvedRoomId!} />
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </div>
    </div>
  );
}
