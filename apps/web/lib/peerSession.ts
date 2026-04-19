import { CTRL_CH_EVENT, FileTransferItem, SOCKET_EVENT } from "@repo/types";
import ShortUniqueId from "short-unique-id";
import { toast } from "sonner";
import { config } from "../constants";
import { useFileTransferStore } from "../store/fileTransferStore";
import { usePeerStore } from "../store/peerStore";

const { randomUUID } = new ShortUniqueId();

export class PeerSession {
  roomId: string = "";
  socket: WebSocket | null = null;

  localPeerId: string = randomUUID(16);
  remotePeerId: string = "";

  _pc: RTCPeerConnection | null = null;
  ctrlChannel: RTCDataChannel | null = null;
  transferChannel: RTCDataChannel | null = null;

  private pendingCandidates: RTCIceCandidateInit[] | null = null;
  private remoteDescriptionSet: boolean = false;

  // sender
  private nextFileIndex = 0;
  private waitForAckResolver: ((value?: unknown) => void) | null = null;
  private chunkSize = 16 * 1024; // 16KB
  private MAX_BUFFER_THRESHOLD = 64 * 1024; // 64KB

  // receiver
  private writeQueue: Promise<void> = Promise.resolve();
  private bytesWrittenSinceAck: number = 0;
  readonly ACK_THRESHOLD = 5 * 1024 * 1024; // 5MB
  private totalBytesReceived: number = 0;
  private lastStoreUpdateTime = Date.now();
  private lastBytes: number = 0;

  // both sides
  private currFile: FileTransferItem | null = null;

  get pc(): RTCPeerConnection {
    if (!this._pc) {
      throw new Error("Peer connection not initialized");
    }
    return this._pc;
  }

  private setLocalPeerId(id: string) {
    this.localPeerId = id;
  }

  setRemotePeerId(id: string) {
    this.remotePeerId = id;
  }

  private set pc(value: RTCPeerConnection) {
    this._pc = value;
  }

  setRoomId(id: string) {
    this.roomId = id;
  }

  private setSocket(ws: WebSocket | null) {
    this.socket = ws;
  }

  connect(
    signalingUrl: string,
    onMessage: (data: MessageEvent) => void,
    onOpen?: () => void,
    onClose?: () => void,
  ) {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const ws = new WebSocket(signalingUrl);

    ws.onopen = () => {
      this.setSocket(ws);
      usePeerStore.getState().setIsConnected(true);
      onOpen?.();
    };

    ws.onmessage = onMessage;

    ws.onerror = () => {
      toast.error("Could not reach signalling server", {
        id: "socket-status",
        description: "Check your connection and try again.",
      });
    };

    ws.onclose = () => {
      this.setSocket(null);
      usePeerStore.getState().setIsConnected(false);
      onClose?.();
    };
  }

  disconnect() {
    this.socket?.close();
    this.setSocket(null);
  }

  reset() {
    this.ctrlChannel?.close();
    this.transferChannel?.close();
    this._pc?.close();
    this.socket?.close();

    this.ctrlChannel = null;
    this.transferChannel = null;
    this._pc = null;
    this.socket = null;
    this.pendingCandidates = null;
    this.remoteDescriptionSet = false;
    this.roomId = "";
    this.remotePeerId = "";
    this.nextFileIndex = 0;
    this.waitForAckResolver = null;
    this.writeQueue = Promise.resolve();
    this.bytesWrittenSinceAck = 0;
    this.totalBytesReceived = 0;
    this.lastStoreUpdateTime = Date.now();
    this.lastBytes = 0;
    this.currFile = null;
  }

  private setcurrFile(file: FileTransferItem | null) {
    this.currFile = file;
  }

  createRoomAndJoin() {
    usePeerStore.getState().setLocalPeerId(this.localPeerId);
    this.socket?.send(
      JSON.stringify({
        type: SOCKET_EVENT.CREATE_ROOM,
        localPeerId: this.localPeerId,
      }),
    );
  }

  joinRoom() {
    usePeerStore.getState().setLocalPeerId(this.localPeerId);
    this.socket?.send(
      JSON.stringify({
        type: SOCKET_EVENT.JOIN_ROOM,
        roomId: this.roomId,
        localPeerId: this.localPeerId,
      }),
    );
  }

  // both sender and receiver
  createRTCPeerConn() {
    this.pendingCandidates = [];
    this.remoteDescriptionSet = false;

    const pc = new RTCPeerConnection(config);
    this.pc = pc;

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        this.socket?.send(
          JSON.stringify({
            type: SOCKET_EVENT.ICE_CANDIDATE,
            roomId: this.roomId,
            localPeerId: this.localPeerId,
            candidate: event.candidate,
          }),
        );
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case "disconnected":
          toast.warning("Peer connection interrupted", {
            id: "peer-connection",
            description: "Waiting for the other device to reconnect.",
          });
          break;
        case "failed":
          toast.error("Peer connection failed", {
            id: "peer-connection",
            description: "Refresh and try the transfer again.",
          });
          break;
      }
    };
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.remoteDescriptionSet) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      this.pendingCandidates?.push(candidate);
    }
  }

  createCtrlChannel() {
    const ctrl = this.pc.createDataChannel("control", {
      ordered: true,
    });
    this.ctrlChannel = ctrl;
    this.ctrlChannel.onmessage = this.listenOnCtrlChannel;
  }

  createTransferChannel() {
    const tc = this.pc.createDataChannel("transfer", {
      ordered: true,
    });
    this.transferChannel = tc;
    this.transferChannel.onmessage = this.listenOnTransferChannel;
    this.transferChannel.bufferedAmountLowThreshold = 64 * 1024;
  }

  async createAndSendOffer() {
    try {
      const offer: RTCSessionDescriptionInit = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      this.socket?.send(
        JSON.stringify({
          type: SOCKET_EVENT.OFFER,
          roomId: this.roomId,
          localPeerId: this.localPeerId,
          offer,
        }),
      );
    } catch (error) {
      console.log(error);
      toast.error("Failed to start transfer", {
        id: "peer-connection",
        description: "Unable to create a WebRTC offer.",
      });
    }
  }

  async handleOffer(offer: RTCSessionDescription) {
    try {
      const pendingCandidates = this.pendingCandidates;
      if (!this._pc) {
        this.createRTCPeerConn();
      }

      await this.pc.setRemoteDescription(offer);
      this.remoteDescriptionSet = true;

      // drain queued candidates
      if (pendingCandidates && pendingCandidates.length > 0) {
        for (const candidate of pendingCandidates) {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        this.pendingCandidates = [];
      }

      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      this.listenOnDataChannel();

      this.socket?.send(
        JSON.stringify({
          type: SOCKET_EVENT.ANSWER,
          roomId: this.roomId,
          localPeerId: this.localPeerId,
          answer,
        }),
      );
    } catch (error) {
      console.log(error);
      toast.error("Failed to accept transfer", {
        id: "peer-connection",
        description: "Unable to create a WebRTC answer.",
      });
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      const pendingCandidates = this.pendingCandidates;

      await this.pc.setRemoteDescription(answer);
      this.remoteDescriptionSet = true;

      // Drain queued candidates only if they exist
      if (pendingCandidates && pendingCandidates.length > 0) {
        for (const candidate of pendingCandidates) {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        this.pendingCandidates = [];
      }
    } catch (error) {
      console.log(error);
      toast.error("Could not finalize peer connection", {
        id: "peer-connection",
        description: "The remote answer could not be applied.",
      });
    }
  }

  private listenOnDataChannel() {
    this.pc.ondatachannel = (event) => {
      const channel = event.channel;
      if (channel.label === "control") {
        this.ctrlChannel = channel;
        this.ctrlChannel.onmessage = this.listenOnCtrlChannel; // message handler set to onmessage event
        this.ctrlChannel.onopen = () => {
          this.ctrlChannel?.send(
            JSON.stringify({
              type: CTRL_CH_EVENT.READY,
            }),
          );
        };
      }
      if (channel.label === "transfer") {
        this.transferChannel = channel;
        this.transferChannel.onmessage = this.listenOnTransferChannel; // message handler set to onmessage event
      }
    };
  }

  private listenOnCtrlChannel = async (event: MessageEvent) => {
    const parsed = JSON.parse(event.data);
    const ctrlChannel = this.ctrlChannel;

    switch (parsed.type) {
      case CTRL_CH_EVENT.READY: {
        const fileTransferItems =
          useFileTransferStore.getState().fileTransferItems;
        this.nextFileIndex = 0;
        ctrlChannel?.send(
          JSON.stringify({
            type: CTRL_CH_EVENT.FILES_META,
            data: fileTransferItems,
          }),
        );

        break;
      }

      case CTRL_CH_EVENT.FILES_META: {
        useFileTransferStore.getState().setFileTransferItems(parsed.data);
        ctrlChannel?.send(
          JSON.stringify({
            type: CTRL_CH_EVENT.REQ_CURR_FILE_META,
          }),
        );
        break;
      }

      case CTRL_CH_EVENT.REQ_CURR_FILE_META: {
        const fileTransferItems =
          useFileTransferStore.getState().fileTransferItems;

        const nextFile = fileTransferItems[this.nextFileIndex];
        this.nextFileIndex += 1;

        if (!nextFile) {
          ctrlChannel?.send(
            JSON.stringify({
              type: CTRL_CH_EVENT.ALL_DONE,
            }),
          );
          return;
        }

        this.setcurrFile(nextFile);
        ctrlChannel?.send(
          JSON.stringify({
            type: CTRL_CH_EVENT.CURR_FILE_META,
            data: this.currFile,
          }),
        );

        break;
      }

      case CTRL_CH_EVENT.CURR_FILE_META: {
        this.setcurrFile(parsed.data);
        useFileTransferStore.getState().setCurrFile(parsed.data);

        // reset
        this.totalBytesReceived = 0;
        this.lastBytes = 0;
        this.lastStoreUpdateTime = Date.now();
        this.bytesWrittenSinceAck = 0; // if sync ack not reset then transfer breaks after few files

        this.downloadFromURL(parsed.data.name); // using service-worker + streams API

        ctrlChannel?.send(
          JSON.stringify({
            type: CTRL_CH_EVENT.TRANSFER_START,
          }),
        );
        break;
      }

      case CTRL_CH_EVENT.TRANSFER_START: {
        const currFile = this.currFile;
        const chunkSize = this.chunkSize;
        const transferChannel = this.transferChannel;

        let offset = 0;
        let bytesSentSinceLastAck = 0;

        let lastBytes = 0;
        let lastStoreUpdateTime = Date.now();

        if (!transferChannel || !currFile) return;

        transferChannel.bufferedAmountLowThreshold = this.MAX_BUFFER_THRESHOLD;

        while (offset < currFile.size) {
          if (transferChannel.bufferedAmount > this.MAX_BUFFER_THRESHOLD) {
            await new Promise<void>((resolve) => {
              transferChannel.onbufferedamountlow = () => {
                transferChannel.onbufferedamountlow = null;
                resolve();
              };
            });
          }

          if (bytesSentSinceLastAck >= this.ACK_THRESHOLD) {
            await new Promise<void>((resolve) => {
              // eslint-disable-next-line
              this.waitForAckResolver = resolve as any;
            });
            bytesSentSinceLastAck = 0;
          }

          const chunk = currFile.file.slice(offset, offset + chunkSize);
          const buffer = await chunk.arrayBuffer();
          transferChannel.send(buffer);

          const bytesSent = buffer.byteLength;
          offset += bytesSent;
          bytesSentSinceLastAck += bytesSent;

          if (Date.now() - lastStoreUpdateTime > 800) {
            const bytesDiff = offset - lastBytes;
            const timeDiff = Date.now() - lastStoreUpdateTime;
            const speed = bytesDiff / (timeDiff / 1000);
            const rawEta =
              speed > 0 ? (currFile.size - this.totalBytesReceived) / speed : 0;
            const eta = Math.round(rawEta);

            useFileTransferStore
              .getState()
              .updateProgress(currFile.id, speed, offset, eta);

            lastBytes = offset;
            lastStoreUpdateTime = Date.now();
          }
        }

        useFileTransferStore
          .getState()
          .updateProgress(currFile.id, 0, currFile.size, 0);

        await new Promise<void>((resolve) => {
          const check = () => {
            if (transferChannel.bufferedAmount === 0) {
              resolve();
            } else {
              setTimeout(check, 50);
            }
          };
          check();
        });

        this.ctrlChannel?.send(JSON.stringify({ type: CTRL_CH_EVENT.EOF }));
        break;
      }

      case CTRL_CH_EVENT.SYNC_ACK: {
        if (this.waitForAckResolver) {
          this.waitForAckResolver();
          this.waitForAckResolver = null;
        }
        break;
      }

      case CTRL_CH_EVENT.EOF: {
        await this.writeQueue;

        if (this.currFile) {
          useFileTransferStore
            .getState()
            .updateProgress(this.currFile.id, 0, this.currFile.size, 0);
        }

        navigator.serviceWorker.controller?.postMessage({
          type: "eof",
        });

        this.ctrlChannel?.send(
          JSON.stringify({
            type: CTRL_CH_EVENT.REQ_CURR_FILE_META,
          }),
        );
        break;
      }

      case CTRL_CH_EVENT.ALL_DONE: {
        break;
      }
    }
  };

  private listenOnTransferChannel = async (event: MessageEvent) => {
    const currFile = this.currFile;
    if (!currFile) return;

    const chunk = event.data;

    this.writeQueue = this.writeQueue.then(async () => {
      try {
        const chunkArray = new Uint8Array(chunk);
        navigator.serviceWorker.controller?.postMessage(chunkArray);

        this.bytesWrittenSinceAck += chunk.byteLength;

        this.totalBytesReceived += chunk.byteLength;

        if (this.bytesWrittenSinceAck >= this.ACK_THRESHOLD) {
          this.sendAckToSender();
          this.bytesWrittenSinceAck = 0;
        }

        if (Date.now() - this.lastStoreUpdateTime > 800) {
          const bytesDiff = this.totalBytesReceived - this.lastBytes;
          const timeDiff = Date.now() - this.lastStoreUpdateTime;
          const speed = bytesDiff / (timeDiff / 1000);
          const rawEta =
            speed > 0 ? (currFile.size - this.totalBytesReceived) / speed : 0;
          const eta = Math.round(rawEta);

          useFileTransferStore
            .getState()
            .updateProgress(currFile.id, speed, this.totalBytesReceived, eta);

          this.lastBytes = this.totalBytesReceived;
          this.lastStoreUpdateTime = Date.now();
        }
      } catch (error) {
        console.error("Disk write failed:", error);
        toast.error("Could not save incoming file", {
          id: "transfer-write-error",
          description: "Check folder permissions and available disk space.",
        });
      }
    });
  };

  private sendAckToSender() {
    this.ctrlChannel?.send(
      JSON.stringify({
        type: CTRL_CH_EVENT.SYNC_ACK,
      }),
    );
  }

  private downloadFromURL(filename: string) {
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = `/download-stream?filename=${filename}`;

    document.body.appendChild(frame);
    setTimeout(() => {
      document.body.removeChild(frame);
    }, 10000);
  }
}

export const peerSession = new PeerSession();
