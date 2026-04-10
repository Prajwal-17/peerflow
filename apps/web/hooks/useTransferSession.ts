"use client";

import { peerSession } from "@/lib/peerSession";
import { useFileTransferStore } from "@/store/fileTransferStore";
import { usePeerStore } from "@/store/peerStore";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const LEAVE_MESSAGE =
  "Leaving this page will stop the current file transfer. Do you want to continue?";
const REDIRECT_DELAY_SECONDS = 10;

export function useTransferSession() {
  const router = useRouter();
  const fileTransferItems = useFileTransferStore((state) => state.fileTransferItems);
  const showIncomingBanner = useFileTransferStore((state) => state.showIncomingBanner);
  const resetTransfers = useFileTransferStore((state) => state.reset);
  const resetPeer = usePeerStore((state) => state.reset);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const isTransferComplete = useMemo(
    () =>
      fileTransferItems.length > 0 &&
      fileTransferItems.every(
        (file) => file.status === "success" || file.status === "failed",
      ),
    [fileTransferItems],
  );

  const hasFailures = useMemo(
    () => fileTransferItems.some((file) => file.status === "failed"),
    [fileTransferItems],
  );

  const isTransferActive =
    !showIncomingBanner && fileTransferItems.length > 0 && !isTransferComplete;

  const stopTransferSession = useCallback(() => {
    peerSession.reset();
    resetTransfers();
    resetPeer();
  }, [resetPeer, resetTransfers]);

  const goHome = useCallback(() => {
    stopTransferSession();
    router.replace("/");
  }, [router, stopTransferSession]);

  const confirmNavigation = useCallback(() => {
    if (!isTransferActive) {
      return true;
    }

    const shouldLeave = window.confirm(LEAVE_MESSAGE);
    if (shouldLeave) {
      stopTransferSession();
    }
    return shouldLeave;
  }, [isTransferActive, stopTransferSession]);

  useEffect(() => {
    if (!isTransferComplete) {
      setRedirectCountdown(null);
      return;
    }

    setRedirectCountdown(REDIRECT_DELAY_SECONDS);

    const countdownId = window.setInterval(() => {
      setRedirectCountdown((current) => {
        if (current === null) return null;
        return current > 0 ? current - 1 : 0;
      });
    }, 1000);

    const redirectId = window.setTimeout(() => {
      goHome();
    }, REDIRECT_DELAY_SECONDS * 1000);

    return () => {
      window.clearInterval(countdownId);
      window.clearTimeout(redirectId);
    };
  }, [goHome, isTransferComplete]);

  useEffect(() => {
    if (!isTransferActive) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      const anchor = target instanceof Element ? target.closest("a[href]") : null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const nextUrl = new URL(href, window.location.href);
      if (nextUrl.href === window.location.href) return;

      event.preventDefault();

      if (!confirmNavigation()) return;

      if (nextUrl.origin === window.location.origin) {
        router.push(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
        return;
      }

      window.location.href = nextUrl.href;
    };

    const handlePopState = () => {
      if (confirmNavigation()) {
        router.replace("/");
        return;
      }

      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("click", handleAnchorClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("click", handleAnchorClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [confirmNavigation, isTransferActive, router]);

  return {
    goHome,
    hasFailures,
    isTransferActive,
    isTransferComplete,
    redirectCountdown,
  };
}
