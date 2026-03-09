import { SOCKET_EVENT } from "@repo/types";
import { useEffect, useState } from "react";
import { peerSession } from "../lib/peerSession";
import { usePeerStore } from "../store/peerStore";

const useSignalling = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_SIGNALLING_SERVER);
    ws.onopen = () => {
      peerSession.setSocket(ws);
      setIsConnected(true);
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case SOCKET_EVENT.PEER_JOINED: {
          usePeerStore.getState().setRemotePeerId(data.remotePeerId);
          peerSession.setRemotePeerId(data.remotePeerId);
          peerSession.createRTCPeerConn(peerSession.localPeerId);
          peerSession.createCtrlChannel();
          peerSession.createTransferChannel();
          peerSession.createAndSendOffer(peerSession.localPeerId);
          break;
        }

        case SOCKET_EVENT.ROOM_JOINED: {
          usePeerStore.getState().setRemotePeerId(data.remotePeerId);
          peerSession.setRemotePeerId(data.remotePeerId);
          peerSession.createRTCPeerConn(peerSession.localPeerId);
          peerSession.listenOnDataChannel(() => {
            peerSession.listenOnCtrlChannel();
            peerSession.listenOnTransferChannel();
          });
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
    ws.onclose = () => {
      peerSession.setSocket(null);
      setIsConnected(false);
    };

    return () => ws.close();
  }, []);

  return { isConnected };
};

export default useSignalling;
