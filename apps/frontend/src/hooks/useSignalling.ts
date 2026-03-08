import { SOCKET_EVENT } from "@repo/types";
import { useEffect, useState } from "react";
import { socketRef } from "../lib/ref";
import {
  createAndSendOffer,
  createControlChannel,
  createDataChannel,
  createRTCPeerConnection,
  handleAnswer,
  handleIceCandidate,
  handleOffer,
  listenOnCtrlChannel,
  listenOnDataChannel,
  listenOnTransferChannel,
} from "../lib/webrtc";
import { usePeerStore } from "../store/peerStore";

const useSignalling = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const localPeerId = usePeerStore((state) => state.localPeerId);
  const setRemotePeerId = usePeerStore((state) => state.setRemotePeerId);

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_SIGNALLING_SERVER);
    ws.onopen = () => {
      socketRef.current = ws;
      setIsConnected(true);
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case SOCKET_EVENT.PEER_JOINED: {
          setRemotePeerId(data.remotePeerId);

          const pc = createRTCPeerConnection(localPeerId);
          createControlChannel(pc);
          createDataChannel(pc);
          createAndSendOffer(pc, localPeerId);
          break;
        }

        case SOCKET_EVENT.ROOM_JOINED: {
          setRemotePeerId(data.remotePeerId);
          const pc = createRTCPeerConnection(localPeerId);
          // use callback to handle race conditions
          listenOnDataChannel(pc, () => {
            listenOnCtrlChannel();
            listenOnTransferChannel();
          });
          break;
        }

        case SOCKET_EVENT.ICE_CANDIDATE:
          handleIceCandidate(data.candidate);
          break;

        case SOCKET_EVENT.OFFER:
          handleOffer(data.offer, localPeerId);
          break;

        case SOCKET_EVENT.ANSWER:
          handleAnswer(data.answer);

          break;
      }
    };
    ws.onclose = () => {
      socketRef.current = null;
      setIsConnected(false);
    };

    return () => ws.close();
  }, []);

  return { isConnected };
};

export default useSignalling;
