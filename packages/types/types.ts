export const SOCKET_EVENT = {
  CREATE_ROOM: "create-room",
  JOIN_ROOM: "join-room",
  ROOM_JOINED: "room-joined",
  // USER_LEFT
  ICE_CANDIDATE: "ice-candidate",
  OFFER: "offer",
  ANSWER: "answer",
  PEER_JOINED: "peer-joined",
  // PING
  // PONG
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
