import { SOCKET_EVENT } from "@repo/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { peerSession } from "../lib/peerSession";
import { usePeerStore } from "../store/peerStore";

const useSignalling = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const ws = new WebSocket(
      process.env.NEXT_PUBLIC_SIGNALLING_SERVER as string,
    );
    ws.onopen = () => {
      peerSession.setSocket(ws);
      setIsConnected(true);
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case SOCKET_EVENT.ROOM_JOINED: {
          usePeerStore.getState().setRoomId(data.roomId);
          usePeerStore.getState().setIsRoomJoined(true);
          router.push(`${usePeerStore.getState().roomId}/send`);

          // usePeerStore.getState().setRemotePeerId(data.remotePeerId);
          // peerSession.setRemotePeerId(data.remotePeerId);
          // peerSession.createRTCPeerConn(peerSession.localPeerId);
          // peerSession.listenOnDataChannel(() => {
          //   peerSession.listenOnCtrlChannel();
          //   peerSession.listenOnTransferChannel();
          // });
          break;
        }

        case SOCKET_EVENT.PEER_JOINED: {
          usePeerStore.getState().setRemotePeerId(data.remotePeerId);
          peerSession.setRemotePeerId(data.remotePeerId);
          peerSession.createRTCPeerConn(peerSession.localPeerId);
          peerSession.createCtrlChannel();
          peerSession.createTransferChannel();
          peerSession.createAndSendOffer(peerSession.localPeerId);
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
