import { create } from "zustand";
import { devtools } from "zustand/middleware";

type IncomingFile = {
  type: string;
  name: string;
  fileType: string;
  size: number;
};

type FileTransferStore = {
  isIncomingFile: boolean;
  setIsIncomingFile: (value: boolean) => void;
  pendingFile: IncomingFile | null;
  setPendingFile: (file: IncomingFile | null) => void;
  // writableStream: FileSystemWritableFileStream | null;
  // setWritableStream: (stream: FileSystemWritableFileStream | null) => void;
  // ctrlChannel: RTCDataChannel | null;
  // setCtrlChannel: (channel: RTCDataChannel) => void;
  resetIncomingFile: () => void;
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

      resetIncomingFile: () =>
        set({
          isIncomingFile: false,
        }),

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
