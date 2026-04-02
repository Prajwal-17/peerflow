export const PEER_TYPE = {
  SEND: "send",
  RECEIVE: "receive",
};

export type PeerType = (typeof PEER_TYPE)[keyof typeof PEER_TYPE];

export const SOCKET_EVENT = {
  // client -> server
  CREATE_ROOM: "room:create",
  JOIN_ROOM: "room:join",
  LEAVE_ROOM: "room:leave",

  // server -> client
  ROOM_JOINED: "room:joined",
  PEER_JOINED: "peer:joined",
  PEER_LEFT: "peer:left",

  ICE_CANDIDATE: "webrtc:ice-candidate",
  OFFER: "webrtc:offer",
  ANSWER: "webrtc:answer",

  ERROR: "error",
};

export type SocketEvent = (typeof SOCKET_EVENT)[keyof typeof SOCKET_EVENT];

export const CTRL_CH_EVENT = {
  // sender -> receiver
  FILES_META: "files:metadata", // send all files metadata
  CURR_FILE_META: "files:current", // the file which is currently transferring
  ALL_DONE: "files:all-done",
  EOF: "eof", // end of file

  // receiver -> sender
  READY: "ready", // connection & data channel are created -> send all files meta
  REQ_CURR_FILE_META: "transfer:files:current",
  TRANSFER_START: "transfer:start",
};

export type CtrlChEvent = (typeof CTRL_CH_EVENT)[keyof typeof CTRL_CH_EVENT];

export type FileTransferItem = {
  id: number;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  file: File;
  status: "success" | "failed" | "pending";
};
