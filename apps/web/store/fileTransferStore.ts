import { create } from "zustand";
import { devtools } from "zustand/middleware";

type IncomingFile = {
  type: string;
  name: string;
  fileType: string;
  size: number;
};

type FileTransferItem = {
  id: number;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  file: File;
};

type FileTransferStore = {
  isIncomingFile: boolean;
  setIsIncomingFile: (value: boolean) => void;
  showIncomingBanner: boolean;
  setShowIncomingBanner: (value: boolean) => void;
  pendingFile: IncomingFile | null;
  setPendingFile: (file: IncomingFile | null) => void;
  // writableStream: FileSystemWritableFileStream | null;
  // setWritableStream: (stream: FileSystemWritableFileStream | null) => void;
  // ctrlChannel: RTCDataChannel | null;
  // setCtrlChannel: (channel: RTCDataChannel) => void;
  resetIncomingFile: () => void;
  fileTransferItems: FileTransferItem[];
  setFileTransferItems: (files: FileTransferItem[]) => void;
};

export const useFileTransferStore = create<FileTransferStore>()(
  devtools(
    (set) => ({
      isIncomingFile: false,
      setIsIncomingFile: (value) =>
        set(
          () => ({
            isIncomingFile: value,
          }),
          false,
          "setIsIncomingFile",
        ),

      showIncomingBanner: false,
      setShowIncomingBanner: (value) =>
        set(() => ({
          showIncomingBanner: value,
        })),

      resetIncomingFile: () =>
        set({
          isIncomingFile: false,
        }),

      fileTransferItems: [],
      setFileTransferItems: (files) =>
        set(() => ({
          fileTransferItems: files,
        })),

      pendingFile: null,
      setPendingFile: (file) =>
        set(
          () => ({
            pendingFile: file,
          }),
          false,
          "setPendingFile",
        ),
    }),

    {
      name: "FileTransferStore",
      enabled: true,
    },
  ),
);
