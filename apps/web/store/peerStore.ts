import { PeerType } from "@repo/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type PeerStore = {
  roomId: string;
  isRoomJoined: boolean;
  localPeerId: string;
  remotePeerId: string;
  peerType: PeerType | undefined;
  selectedFiles: File[];
  setRoomId: (id: string) => void;
  setIsRoomJoined: (value: boolean) => void;
  setLocalPeerId: (id: string) => void;
  setRemotePeerId: (id: string) => void;
  setPeerType: (type: PeerType) => void;
  setSelectedFiles: (files: File[] | []) => void;
};

export const usePeerStore = create<PeerStore>()(
  devtools((set) => ({
    roomId: "",
    setRoomId: (id) => set({ roomId: id }),

    isRoomJoined: false,
    setIsRoomJoined: (value) =>
      set({
        isRoomJoined: value,
      }),

    localPeerId: "",
    setLocalPeerId: (id) => set({ localPeerId: id }),

    remotePeerId: "",
    setRemotePeerId: (id) => set({ remotePeerId: id }),

    peerType: undefined,
    setPeerType: (type) => set({ peerType: type }),

    selectedFiles: [],
    setSelectedFiles: (files) =>
      set(() => ({
        selectedFiles: files,
      })),
  })),
);
