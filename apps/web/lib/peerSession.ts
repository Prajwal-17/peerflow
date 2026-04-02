import { CTRL_CH_EVENT, FileTransferItem, SOCKET_EVENT } from "@repo/types";
import ShortUniqueId from "short-unique-id";
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
  pendingCandidates: RTCIceCandidateInit[] | null = null;
  remoteDescriptionSet: boolean = false;
  ctrlChannel: RTCDataChannel | null = null;
  transferChannel: RTCDataChannel | null = null;

  nextFileIndex = 0;
  currFileMeta: FileTransferItem | null = null;
  dirHandler: FileSystemDirectoryHandle | null = null;
  fileHandler: FileSystemFileHandle | null = null;
  writableStream: FileSystemWritableFileStream | null = null;

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

  setRoomId(id: string) {
    this.roomId = id;
  }

  setSocket(ws: WebSocket | null) {
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

  setCurrFileMeta(file: FileTransferItem | null) {
    this.currFileMeta = file;
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
    }
  }

  async handleOffer(offer: RTCSessionDescription) {
    try {
      if (!this._pc) {
        this.createRTCPeerConn();
      }

      await this.pc.setRemoteDescription(offer);
      this.remoteDescriptionSet = true;

      // drain queued candidates
      for (const candidate of this.pendingCandidates!) {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      this.pendingCandidates = [];

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
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(answer);

    this.remoteDescriptionSet = true;

    for (const candidate of this.pendingCandidates!) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    this.pendingCandidates = [];
  }

  listenOnDataChannel(onReady?: () => void) {
    const received: Record<string, boolean> = {};

    this.pc.ondatachannel = (event) => {
      const channel = event.channel;
      if (channel.label === "control") {
        this.ctrlChannel = channel;
        this.ctrlChannel.onmessage = this.listenOnCtrlChannel;
        this.ctrlChannel.onopen = () => {
          this.ctrlChannel?.send(
            JSON.stringify({
              type: CTRL_CH_EVENT.READY,
            }),
          );
        };
        received.control = true;
      }
      if (channel.label === "transfer") {
        this.transferChannel = channel;
        this.transferChannel.onmessage = this.listenOnTransferChannel;
        received.transfer = true;
      }
      if (received.control && received.transfer) {
        onReady?.();
      }
    };
  }

  listenOnCtrlChannel = async (event: MessageEvent) => {
    const parsed = JSON.parse(event.data);

    switch (parsed.type) {
      case CTRL_CH_EVENT.READY: {
        const fileTransferItems =
          useFileTransferStore.getState().fileTransferItems;
        this.nextFileIndex = 0;
        this.ctrlChannel?.send(
          JSON.stringify({
            type: CTRL_CH_EVENT.FILES_META,
            data: fileTransferItems,
          }),
        );

        break;
      }
      case CTRL_CH_EVENT.FILES_META: {
        useFileTransferStore.getState().setFileTransferItems(parsed.data);
        this.ctrlChannel?.send(
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
          this.ctrlChannel?.send(
            JSON.stringify({
              type: CTRL_CH_EVENT.ALL_DONE,
            }),
          );
          return;
        }

        this.setCurrFileMeta(nextFile);
        this.ctrlChannel?.send(
          JSON.stringify({
            type: CTRL_CH_EVENT.CURR_FILE_META,
            data: this.currFileMeta,
          }),
        );

        break;
      }

      case CTRL_CH_EVENT.CURR_FILE_META: {
        this.setCurrFileMeta(parsed.data);
        useFileTransferStore.getState().setCurrFile(parsed.data);

        if (!this.dirHandler) {
          useFileTransferStore.getState().setShowIncomingBanner(true);
          break;
        }

        const fileHandler = await this.dirHandler?.getFileHandle(
          parsed.data.name,
          {
            create: true,
          },
        );
        this.setfileHandler(fileHandler ?? null);

        const writable = await fileHandler?.createWritable();
        peerSession.setWritableStream(writable ?? null);

        peerSession.ctrlChannel?.send(
          JSON.stringify({
            type: CTRL_CH_EVENT.TRANSFER_START,
          }),
        );
        break;
      }

      case CTRL_CH_EVENT.TRANSFER_START: {
        let offset = 0;
        const chunkSize = 16 * 1024;
        const fileItem = this.currFileMeta;

        if (!fileItem) {
          return;
        }

        while (offset < fileItem.size) {
          const chunk = fileItem.file.slice(offset, offset + chunkSize);
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

        break;
      }

      case CTRL_CH_EVENT.EOF: {
        if (this.writableStream) {
          await this.writableStream.close();
          this.setWritableStream(null);
          this.setfileHandler(null);
        }
        this.ctrlChannel?.send(
          JSON.stringify({
            type: CTRL_CH_EVENT.REQ_CURR_FILE_META,
          }),
        );
        break;
      }
    }
  };

  listenOnTransferChannel = async (event: MessageEvent) => {
    if (!this.writableStream) {
      console.log("Error no writable stream");
      return;
    }
    const chunk = new Uint8Array(event.data);
    await this.writableStream.write(chunk);
  };
}

export const peerSession = new PeerSession();
