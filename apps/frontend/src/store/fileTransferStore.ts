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
  setIsIncomingFile: () => void;
  pendingFile: IncomingFile | null;
  setPendingFile: (file: IncomingFile) => void;
  writableStream: FileSystemWritableFileStream | null;
  setWritableStream: (stream: FileSystemWritableFileStream) => void;
  ctrlChannel: RTCDataChannel | null;
  setCtrlChannel: (channel: RTCDataChannel) => void;
};

export const useFileTransferStore = create<FileTransferStore>()(
  devtools(
    (set) => ({
      isIncomingFile: false,
      setIsIncomingFile: () =>
        set(
          (state) => ({
            isIncomingFile: !state.isIncomingFile,
          }),
          false,
          "setIsIncomingFile",
        ),

      pendingFile: null,
      setPendingFile: (file) =>
        set(
          () => ({
            pendingFile: file,
          }),
          false,
          "setPendingFile",
        ),

      writableStream: null,
      setWritableStream: (stream) =>
        set(
          () => ({
            writableStream: stream,
          }),
          false,
          "setWritableStream",
        ),

      ctrlChannel: null,
      setCtrlChannel: (channel) =>
        set(
          () => ({
            ctrlChannel: channel,
          }),
          false,
          "setCtrlChannel",
        ),
    }),
    {
      name: "FileTransferStore",
      enabled: true,
    },
  ),
);
