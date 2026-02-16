import { SOCKET_EVENT } from "@repo/types";
import { dcRef, pcRef, roomIdRef, socketRef } from "./ref";

const config = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
  try {
    await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.log(error);
  }
};

export const createRTCPeerConnection = (localPeerId: string) => {
  const pc = new RTCPeerConnection(config);
  pcRef.current = pc;

  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      socketRef.current?.send(
        JSON.stringify({
          type: SOCKET_EVENT.ICE_CANDIDATE,
          roomId: roomIdRef.current,
          localPeerId: localPeerId,
          candidate: event.candidate,
        }),
      );
    }
  };
  return pc;
};

export const listenOnDataChannel = (pc: RTCPeerConnection) => {
  pc.ondatachannel = (event) => {
    const channel = event.channel;

    let pendingFileMeta: {
      type: string;
      name: string;
      fileType: string;
      size: number;
    } | null = null;

    channel.onmessage = (msgEvent) => {
      const { data } = msgEvent;
      if (typeof data == "string") {
        const parsed = JSON.parse(data);
        if (parsed.type === "file-meta") {
          pendingFileMeta = parsed;
        }
      } else {
        if (pendingFileMeta) {
          const tempData = new Blob([data], {
            type: pendingFileMeta.fileType,
          });
          const url = URL.createObjectURL(tempData);
          const a = document.createElement("a");
          a.href = url;
          a.download = pendingFileMeta.name;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
        } else {
          console.log("File meta does not exist");
        }
      }
    };
  };
};

export const createDataChannel = (pc: RTCPeerConnection) => {
  const dc = pc.createDataChannel("file-transfer", {
    ordered: true,
  });
  dc.onopen = () => {
    console.log("data channel opened");
  };
  dcRef.current = dc;
};

export const createAndSendOffer = async (
  pc: RTCPeerConnection,
  localPeerId: string,
) => {
  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current?.send(
      JSON.stringify({
        type: SOCKET_EVENT.OFFER,
        roomId: roomIdRef.current,
        localPeerId,
        offer,
      }),
    );
  } catch (error) {
    console.log(error);
  }
};

export const handleOffer = async (
  offer: RTCSessionDescriptionInit,
  localPeerId: string,
) => {
  try {
    await pcRef.current?.setRemoteDescription(offer);
    const answer = await pcRef.current?.createAnswer();
    await pcRef.current?.setLocalDescription(answer);

    socketRef.current?.send(
      JSON.stringify({
        type: SOCKET_EVENT.ANSWER,
        roomId: roomIdRef.current,
        localPeerId,
        answer: answer,
      }),
    );
  } catch (error) {
    console.log(error);
  }
};

export const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
  try {
    await pcRef.current?.setRemoteDescription(answer);
  } catch (error) {
    console.log(error);
  }
};
