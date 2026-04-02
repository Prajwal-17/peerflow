import { peerSession } from "@/lib/peerSession";
import { useFileTransferStore } from "@/store/fileTransferStore";
import { usePeerStore } from "@/store/peerStore";
import { FileTransferItem } from "@repo/types";
import { useEffect } from "react";

export const useTransferSetup = (
  dropdownRef: React.RefObject<HTMLDivElement | null>,
  fileInputRef: React.RefObject<HTMLInputElement | null>,
  setIsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const roomId = usePeerStore((state) => state.roomId);
  const isRoomJoined = usePeerStore((state) => state.isRoomJoined);
  const setFileTransferItems = useFileTransferStore(
    (state) => state.setFileTransferItems,
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChooseFromDevice = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files) return;

    const filesArray: FileTransferItem[] = Array.from(files).map(
      (file, idx) => ({
        id: idx,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        file: file,
        status: "pending",
      }),
    );

    setFileTransferItems(filesArray);

    if (roomId && isRoomJoined) return;
    peerSession.createRoomAndJoin();
  };

  const handleChooseSavedItems = () => {};

  return {
    handleFilesSelected,
    handleChooseFromDevice,
    handleChooseSavedItems,
  };
};
