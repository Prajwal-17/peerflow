import { FileTransferItem } from "@repo/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type FileTransferStore = {
  currFile: FileTransferItem | null;
  setCurrFile: (file: FileTransferItem | null) => void;
  showIncomingBanner: boolean;
  setShowIncomingBanner: (value: boolean) => void;
  fileTransferItems: FileTransferItem[];
  setFileTransferItems: (files: FileTransferItem[]) => void;
  updateProgress: (
    id: number,
    speed: number,
    bytes: number,
    eta: number,
  ) => void;
};

export const useFileTransferStore = create<FileTransferStore>()(
  devtools(
    (set) => ({
      currFile: null,
      setCurrFile: (file) =>
        set(() => ({
          currFile: file,
        })),

      showIncomingBanner: false,
      setShowIncomingBanner: (value) =>
        set(() => ({
          showIncomingBanner: value,
        })),

      fileTransferItems: [],

      setFileTransferItems: (files) =>
        set(() => ({
          fileTransferItems: files,
        })),

      updateProgress: (id, speed, bytes, eta) =>
        set((state) => {
          const updatedItems = [...state.fileTransferItems];

          const item = updatedItems[id];
          if (!item) return state;

          updatedItems[id] = {
            ...item,
            progressBytes: bytes,
            speed: speed,
            eta: eta,
            status: item.size === bytes ? "success" : "pending",
          };

          return {
            fileTransferItems: updatedItems,
          };
        }),
    }),

    {
      name: "FileTransferStore",
      enabled: true,
    },
  ),
);
