import { SOCKET_EVENT } from "@repo/types";
import { useFileTransferStore } from "../store/fileTransferStore";
import { ctrlRef, dcRef, pcRef, roomIdRef, socketRef } from "./ref";

const config = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
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

export const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
  try {
    await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.log(error);
  }
};

export const createControlChannel = (pc: RTCPeerConnection) => {
  const ctrl = pc.createDataChannel("control", {
    ordered: true,
  });
  ctrl.onopen = () => {
    console.log("Control channel opened");
  };
  ctrlRef.current = ctrl;
};

export const createDataChannel = (pc: RTCPeerConnection) => {
  const dc = pc.createDataChannel("transfer", {
    ordered: true,
  });
  dc.onopen = () => {
    console.log("data channel opened");
  };
  dcRef.current = dc;
  dcRef.current.bufferedAmountLowThreshold = 64 * 1024;
};

export const listenOnDataChannel = (
  pc: RTCPeerConnection,
  onReady?: () => void,
) => {
  const received: Record<string, boolean> = {};

  pc.ondatachannel = (event) => {
    const channel = event.channel;
    if (channel.label === "control") {
      ctrlRef.current = channel;
      received.control = true;
    }
    if (channel.label === "transfer") {
      dcRef.current = channel;
      received.transfer = true;
    }
    if (received.control && received.transfer) {
      onReady?.();
    }
  };
};

export const listenOnCtrlChannel = () => {
  const channel = ctrlRef.current;
  if (!channel) {
    console.error("Control Channel does not exist");
    return;
  }

  useFileTransferStore.getState().setCtrlChannel(channel);
  channel.onmessage = async (event) => {
    const parsed = JSON.parse(event.data);
    if (parsed.type === "file-meta") {
      useFileTransferStore.getState().setIsIncomingFile();
      useFileTransferStore.getState().setPendingFile(parsed);
    }

    if (parsed.type === "eof") {
      const writable = useFileTransferStore.getState().writableStream;
      if (writable) {
        await writable?.close();
      }
    }
  };
};

export const listenOnTransferChannel = () => {
  const channel = dcRef.current;
  if (!channel) {
    console.error("Transfer Channel does not exist");
    return;
  }

  channel.onmessage = async (event) => {
    const writable = useFileTransferStore.getState().writableStream;
    const chunk = new Uint8Array(event.data);
    await writable?.write(chunk);
  };
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
