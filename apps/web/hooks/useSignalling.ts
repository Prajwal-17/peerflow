import { usePeerStore } from "@/store/peerStore";
import { SOCKET_EVENT } from "@repo/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { peerSession } from "../lib/peerSession";

/**
 * Initialises the signalling WebSocket exactly once for the entire app session.
 * Safe to call from any page — peerSession.connect() is a no-op when a
 * connection is already open or connecting, so multiple calls are harmless.
 *
 * Mount this hook at the layout level (or at minimum on every top-level page)
 * so the connection is available wherever it is needed.
 */
const useSignalling = () => {
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case SOCKET_EVENT.ROOM_JOINED: {
          usePeerStore.getState().setRoomId(data.roomId);
          usePeerStore.getState().setIsRoomJoined(true);
          if (data.redirect) {
            router.push(`${data.roomId}/send`);
          }
          break;
        }

        case SOCKET_EVENT.PEER_JOINED: {
          usePeerStore.getState().setRemotePeerId(data.remotePeerId);
          peerSession.setRemotePeerId(data.remotePeerId);

          // start creating rtc conn
          // peerSession.createRTCPeerConn(peerSession.localPeerId);
          // peerSession.createCtrlChannel();
          // peerSession.createTransferChannel();
          // peerSession.createAndSendOffer(peerSession.localPeerId);
          break;
        }

        case SOCKET_EVENT.ICE_CANDIDATE:
          peerSession.handleIceCandidate(data.candidate);
          break;

        case SOCKET_EVENT.OFFER:
          peerSession.handleOffer(data.offer, peerSession.localPeerId);
          break;

        case SOCKET_EVENT.ANSWER:
          peerSession.handleAnswer(data.answer);
          break;
      }
    };

    peerSession.connect(
      process.env.NEXT_PUBLIC_SIGNALLING_SERVER as string,
      handleMessage,
    );

    // Never disconnect on unmount — the connection must survive page transitions.
    // The server/browser will clean it up when the tab closes.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useSignalling;
