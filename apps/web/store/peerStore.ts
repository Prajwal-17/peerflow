import { PeerType } from "@repo/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type PeerStore = {
  roomId: string;
  setRoomId: (id: string) => void;
  isRoomJoined: boolean;
  setIsRoomJoined: (value: boolean) => void;
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  localPeerId: string;
  setLocalPeerId: (id: string) => void;
  remotePeerId: string;
  setRemotePeerId: (id: string) => void;
  peerType: PeerType | undefined;
  setPeerType: (type: PeerType) => void;
};

export const usePeerStore = create<PeerStore>()(
  devtools((set) => ({
    roomId: "",
    setRoomId: (id) => set({ roomId: id }),

    isRoomJoined: false,
    setIsRoomJoined: (value) => set({ isRoomJoined: value }),

    isConnected: false,
    setIsConnected: (value) => set({ isConnected: value }),

    localPeerId: "",
    setLocalPeerId: (id) => set({ localPeerId: id }),

    remotePeerId: "",
    setRemotePeerId: (id) => set({ remotePeerId: id }),

    peerType: undefined,
    setPeerType: (type) => set({ peerType: type }),
  })),
);
