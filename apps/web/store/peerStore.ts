import { create } from "zustand";
import { devtools } from "zustand/middleware";

type PeerStore = {
  roomId: string;
  localPeerId: string;
  remotePeerId: string;
  type: "send" | "receive" | undefined;
  selectedFiles: File[];
  setRoomId: (id: string) => void;
  setLocalPeerId: (id: string) => void;
  setRemotePeerId: (id: string) => void;
  setType: (type: "send" | "receive") => void;
  setSelectedFiles: (files: File[] | []) => void;
};

export const usePeerStore = create<PeerStore>()(
  devtools((set) => ({
    roomId: "",
    setRoomId: (id) => set({ roomId: id }),

    localPeerId: "",
    setLocalPeerId: (id) => set({ localPeerId: id }),

    remotePeerId: "",
    setRemotePeerId: (id) => set({ remotePeerId: id }),

    type: undefined,
    setType: (type) => set({ type }),

    selectedFiles: [],
    setSelectedFiles: (files) =>
      set(() => ({
        selectedFiles: files,
      })),
  })),
);
