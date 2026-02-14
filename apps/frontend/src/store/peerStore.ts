import ShortUniqueId from "short-unique-id";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type PeerStore = {
  roomId: string;
  localPeerId: string;
  remotePeerId: string;
  type: "send" | "receive" | undefined;
  selectedFiles: File[];
  setRoomId: (id: string) => void;
  setLocalPeerId: () => void;
  setRemotePeerId: (id: string) => void;
  setType: (type: "send" | "receive") => void;
  setSelectedFiles: (files: File[] | []) => void;
};

const { randomUUID } = new ShortUniqueId({
  dictionary: "alpha_upper",
  length: 5,
});

export const usePeerStore = create<PeerStore>()(
  devtools((set) => ({
    roomId: randomUUID(),
    setRoomId: (id) => set({ roomId: id }),

    localPeerId: randomUUID(16),
    setLocalPeerId: () => set({ localPeerId: randomUUID() }),

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
