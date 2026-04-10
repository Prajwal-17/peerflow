"use client";

import { CheckCircle2, TriangleAlert, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function AppToaster(): React.JSX.Element {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return (
    <Toaster
      closeButton
      position={isMobile ? "bottom-center" : "bottom-right"}
      offset={isMobile ? 16 : 24}
      mobileOffset={16}
      visibleToasts={3}
      icons={{
        success: <CheckCircle2 size={16} className="text-accent" />,
        warning: <TriangleAlert size={16} className="text-white/70" />,
        error: <XCircle size={16} className="text-red-400" />,
        close: <X size={14} />,
      }}
      toastOptions={{
        unstyled: true,
        duration: 3600,
        classNames: {
          toast:
            "relative flex w-[min(92vw,340px)] items-start gap-3 rounded-xl border border-white/10 bg-surface/95 px-4 py-3 pr-11 text-foreground shadow-[0_16px_32px_rgba(0,0,0,0.28)] backdrop-blur-md sm:w-[340px]",
          content: "flex min-w-0 flex-1 flex-col gap-1 pr-1",
          icon: "mt-0.5 shrink-0",
          title:
            "truncate pr-2 text-[13px] font-semibold leading-5 tracking-[0.01em] text-white",
          description:
            "truncate font-mono text-[10.5px] leading-4 tracking-[0.03em] text-white/65",
          closeButton:
            "absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white",
          success: "border-accent/25",
          error: "border-red-400/25",
          warning: "border-white/12",
        },
      }}
    />
  );
}
