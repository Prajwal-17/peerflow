"use client";

import { CODE_LENGTH } from "@/constants";
import { Download } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

export default function RoomCodeEntry({
  onJoin,
}: {
  onJoin: (code: string) => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusNext = (i: number) => inputRefs.current[i + 1]?.focus();
  const focusPrev = (i: number) => inputRefs.current[i - 1]?.focus();

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    i: number,
  ) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
      } else {
        focusPrev(i);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusPrev(i);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusNext(i);
    } else if (e.key === "Enter") {
      triggerJoin(digits);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const raw = e.target.value.replace(/\s/g, "");
    if (!raw) return;

    if (raw.length > 1) {
      const chars = raw.slice(0, CODE_LENGTH - i).split("");
      const next = [...digits];
      chars.forEach((ch, offset) => {
        if (i + offset < CODE_LENGTH) next[i + offset] = ch.toUpperCase();
      });
      setDigits(next);
      inputRefs.current[Math.min(i + chars.length, CODE_LENGTH - 1)]?.focus();
      return;
    }

    const char = raw[raw.length - 1].toUpperCase();
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    if (i < CODE_LENGTH - 1) focusNext(i);
  };

  const handlePaste = (e: React.ClipboardEvent, i: number) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\s/g, "")
      .toUpperCase();
    const chars = pasted.slice(0, CODE_LENGTH - i).split("");
    const next = [...digits];
    chars.forEach((ch, offset) => {
      if (i + offset < CODE_LENGTH) next[i + offset] = ch;
    });
    setDigits(next);
    setTimeout(
      () =>
        inputRefs.current[Math.min(i + chars.length, CODE_LENGTH - 1)]?.focus(),
      0,
    );
  };

  const triggerJoin = useCallback(
    (d: string[]) => {
      const code = d.join("").trim();
      if (code.length < CODE_LENGTH) {
        setShake(true);
        setTimeout(() => setShake(false), 600);
        return;
      }
      onJoin(code);
    },
    [onJoin],
  );

  const isFilled = digits.every((d) => d !== "");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pt-10 pb-8 text-center sm:px-8 sm:pt-12 sm:pb-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full max-w-md flex-col items-center"
      >
        {/* Icon badge */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_30px_rgba(0,229,160,0.12)]">
          <Download size={26} className="text-accent" />
        </div>

        <h1 className="mb-2 text-[28px] font-extrabold tracking-[-0.02em] text-white sm:text-[34px]">
          Receive files
        </h1>
        <p className="text-muted mb-10 max-w-xs font-mono text-sm leading-relaxed">
          Enter the room code shared by the sender to join the session.
        </p>

        {/* OTP boxes */}
        <motion.div
          animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center gap-2.5 sm:gap-3.5"
        >
          {digits.map((digit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
              className="relative"
            >
              <input
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                id={`room-code-digit-${i}`}
                type="text"
                inputMode="text"
                maxLength={6}
                value={digit}
                autoFocus={i === 0}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={(e) => handlePaste(e, i)}
                onFocus={(e) => e.target.select()}
                className={[
                  "h-14 w-11 rounded-xl border bg-white/5 text-center font-mono text-lg font-bold text-white outline-none",
                  "caret-transparent transition-all duration-150",
                  "sm:h-16 sm:w-13 sm:text-xl",
                  digit
                    ? "border-accent text-accent shadow-[0_0_14px_rgba(0,229,160,0.25)]"
                    : "border-white/15 hover:border-white/30",
                  "focus:border-accent focus:shadow-[0_0_18px_rgba(0,229,160,0.3)]",
                ].join(" ")}
              />
              {digit && (
                <motion.div
                  layoutId={`digit-underline-${i}`}
                  className="bg-accent absolute -bottom-px left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full"
                />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Join button */}
        <motion.button
          whileHover={isFilled ? { y: -2 } : {}}
          whileTap={isFilled ? { scale: 0.97 } : {}}
          onClick={() => triggerJoin(digits)}
          disabled={!isFilled}
          className={[
            "flex w-full max-w-xs items-center justify-center gap-2.5 rounded-xl border-none px-7 py-3.5",
            "font-sans text-[15px] font-bold tracking-[0.04em] transition-all duration-200",
            isFilled
              ? "bg-accent cursor-pointer text-black shadow-[0_0_24px_rgba(0,229,160,0.35)] hover:shadow-[0_4px_32px_rgba(0,229,160,0.4)]"
              : "cursor-not-allowed bg-white/8 text-white/30",
          ].join(" ")}
        >
          <Download size={17} />
          Join Room
        </motion.button>

        <p className="text-muted mt-6 font-mono text-xs tracking-wider">
          Ask the sender for their{" "}
          <span className="text-accent">5-character</span> room code
        </p>
      </motion.div>
    </main>
  );
}
