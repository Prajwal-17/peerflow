import { usePeerStore } from "@/store/peerStore";
import { SOCKET_EVENT } from "@repo/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { peerSession } from "../lib/peerSession";

const useSignalling = () => {
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case SOCKET_EVENT.ROOM_JOINED: {
          usePeerStore.getState().setRoomId(data.roomId);
          peerSession.setRoomId(data.roomId);
          usePeerStore.getState().setIsRoomJoined(true);
          if (data.redirect) {
            router.push(`${data.roomId}/send`);
          }
          break;
        }

        case SOCKET_EVENT.PEER_JOINED: {
          usePeerStore.getState().setRemotePeerId(data.remotePeerId);
          peerSession.setRemotePeerId(data.remotePeerId);

          peerSession.createRTCPeerConn();
          peerSession.createCtrlChannel();
          peerSession.createTransferChannel();

          peerSession.createAndSendOffer();

          break;
        }

        case SOCKET_EVENT.ICE_CANDIDATE:
          peerSession.handleIceCandidate(data.candidate);
          break;

        case SOCKET_EVENT.OFFER:
          // create a rtc conn and then accept offer
          peerSession.handleOffer(data.offer);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useSignalling;
