import { SOCKET_EVENT } from "@repo/types";
import ShortUniqueId from "short-unique-id";
import { config } from "../constants";
import { useFileTransferStore } from "../store/fileTransferStore";

const { randomUUID } = new ShortUniqueId({
  dictionary: "alpha_upper",
  length: 5,
});

export class PeerSession {
  roomId: string = randomUUID();
  socket: WebSocket | null = null;

  localPeerId: string = randomUUID(16);
  remotePeerId: string = "";

  _pc: RTCPeerConnection | null = null;
  ctrlChannel: RTCDataChannel | null = null;
  transferChannel: RTCDataChannel | null = null;

  dirHandler: FileSystemDirectoryHandle | null = null;
  fileHandler: FileSystemFileHandle | null = null;
  writableStream: FileSystemWritableFileStream | null = null;
  // file handle
  // writable stream

  get pc(): RTCPeerConnection {
    if (!this._pc) {
      throw new Error("Peer connection not initialized");
    }
    return this._pc;
  }

  setLocalPeerId(id: string) {
    this.localPeerId = id;
  }

  setRemotePeerId(id: string) {
    this.remotePeerId = id;
  }

  set pc(value: RTCPeerConnection) {
    this._pc = value;
  }

  /// -------

  setRoomId(id: string) {
    this.roomId = id;
  }

  setSocket(ws: WebSocket | null) {
    this.socket = ws;
  }

  setfileHandler(handler: FileSystemFileHandle | null) {
    this.fileHandler = handler;
  }

  setDirHandler(handler: FileSystemDirectoryHandle | null) {
    this.dirHandler = handler;
  }

  setWritableStream(stream: FileSystemWritableFileStream | null) {
    this.writableStream = stream;
  }

  // both sender and receiver
  createRTCPeerConn(localPeerId: string) {
    const pc = new RTCPeerConnection(config);
    this.pc = pc;

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        this.socket?.send(
          JSON.stringify({
            type: SOCKET_EVENT.ICE_CANDIDATE,
            roomId: this.roomId,
            localPeerId: localPeerId,
            candidate: event.candidate,
          }),
        );
      }
    };
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.log(error);
    }
  }

  createCtrlChannel() {
    const ctrl = this.pc.createDataChannel("control", {
      ordered: true,
    });
    ctrl.onopen = () => {
      console.log("Control channel opened");
    };
    this.ctrlChannel = ctrl;
  }

  createTransferChannel() {
    const tc = this.pc.createDataChannel("transfer", {
      ordered: true,
    });
    tc.onopen = () => {
      console.log("data channel opened");
    };
    this.transferChannel = tc;
    this.transferChannel.bufferedAmountLowThreshold = 64 * 1024;
  }

  async createAndSendOffer(localPeerId: string) {
    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      this.socket?.send(
        JSON.stringify({
          type: SOCKET_EVENT.OFFER,
          roomId: this.roomId,
          localPeerId,
          offer,
        }),
      );
    } catch (error) {
      console.log(error);
    }
  }

  async handleOffer(offer: RTCSessionDescription, localPeerId: string) {
    try {
      await this.pc.setRemoteDescription(offer);
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      this.socket?.send(
        JSON.stringify({
          type: SOCKET_EVENT.ANSWER,
          roomId: this.roomId,
          localPeerId,
          answer: answer,
        }),
      );
    } catch (error) {
      console.log(error);
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      await this.pc.setRemoteDescription(answer);
    } catch (error) {
      console.log(error);
    }
  }

  listenOnDataChannel(onReady?: () => void) {
    const received: Record<string, boolean> = {};

    this.pc.ondatachannel = (event) => {
      const channel = event.channel;
      if (channel.label === "control") {
        this.ctrlChannel = channel;
        received.control = true;
      }
      if (channel.label === "transfer") {
        this.transferChannel = channel;
        received.transfer = true;
      }
      if (received.control && received.transfer) {
        onReady?.();
      }
    };
  }

  listenOnCtrlChannel() {
    const channel = this.ctrlChannel;
    if (!channel) {
      console.error("Control Channel does not exist");
      return;
    }

    channel.onmessage = async (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.type === "file-meta") {
        useFileTransferStore.getState().setIsIncomingFile(true);
        useFileTransferStore.getState().setPendingFile(parsed);
      }

      if (parsed.type === "eof") {
        if (this.writableStream) {
          await this.writableStream.close();
          this.setWritableStream(null);
          this.setfileHandler(null);
          useFileTransferStore.getState().setIsIncomingFile(false);
        }
      }
    };
  }

  listenOnTransferChannel() {
    const channel = this.transferChannel;
    if (!channel) {
      console.error("Transfer Channel does not exist");
      return;
    }

    channel.onmessage = async (event) => {
      if (!this.writableStream) {
        console.log("Error no writable stream");
        return;
      }
      // const writable = useFileTransferStore.getState().this.;
      const chunk = new Uint8Array(event.data);
      await this.writableStream.write(chunk);
    };
  }

  async sendFiles(selectedFiles: File[]) {
    for (const file of selectedFiles) {
      const metadata = JSON.stringify({
        type: "file-meta",
        name: file.name,
        fileType: file.type,
        size: file.size,
      });
      console.log("here", metadata);
      this.ctrlChannel?.send(metadata);

      if (!this.ctrlChannel) {
        console.error(
          "Data Channel Reference is NULL. Did you call createDataChannel yet?",
        );
        return;
      }

      const waitForReady = (): Promise<void> => {
        return new Promise((resolve) => {
          if (!this.ctrlChannel) return;
          this.ctrlChannel.addEventListener(
            "message",
            (event) => {
              const message = JSON.parse(event.data);
              if (message.type === "ready") {
                resolve();
              }
            },
            { once: true },
          );
        });
      };
      await waitForReady();

      let offset = 0;
      const chunkSize = 16 * 1024;

      while (offset < file.size) {
        const chunk = file.slice(offset, offset + chunkSize);
        const buffer = await chunk.arrayBuffer();
        this.transferChannel?.send(buffer);
        offset += chunkSize;
      }

      const checkBufferAndSendEOF = async () => {
        if (this.transferChannel?.bufferedAmount === 0) {
          this.ctrlChannel?.send(
            JSON.stringify({
              type: "eof",
            }),
          );
        } else {
          setTimeout(checkBufferAndSendEOF, 50);
        }
      };
      await checkBufferAndSendEOF();
    }
  }
  // ---
}

export const peerSession = new PeerSession();
