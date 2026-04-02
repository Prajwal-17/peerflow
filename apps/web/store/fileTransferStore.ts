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
};

export const useFileTransferStore = create<FileTransferStore>()(
  devtools(
    (set) => ({
      currFile: null,
      setCurrFile: (file) =>
        set(
          () => ({
            currFile: file,
          }),
          false,
          "setCurrFile",
        ),

      showIncomingBanner: false,
      setShowIncomingBanner: (value) =>
        set(
          () => ({
            showIncomingBanner: value,
          }),
          false,
          "setShowIncomingBanner",
        ),

      fileTransferItems: [],
      setFileTransferItems: (files) =>
        set(
          () => ({
            fileTransferItems: files,
          }),
          false,
          "setFileTransferItems",
        ),
    }),
    {
      name: "FileTransferStore",
      enabled: true,
    },
  ),
);
