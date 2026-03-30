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

export type BaseMessage = {
  event: SocketEvent;
  localPeerId: string;
};

export type OfferMessage = BaseMessage & {
  offer: RTCSessionDescription;
};

export type AnswerMessage = BaseMessage & {
  answer: RTCSessionDescription;
};

export type IceCandidateMessage = BaseMessage & {
  offer: RTCIceCandidate;
};

// export type RoomJoinedMessage = BaseMessage & {
//   remotePeerId: string;
//   msg: string;
// };

// export type UserJoinedMessage = BaseMessage & {
//   remotePeerId: string;
//   msg: string;
// };
