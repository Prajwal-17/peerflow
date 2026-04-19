import { peerSession } from "@/lib/peerSession";
import { useFileTransferStore } from "@/store/fileTransferStore";
import { usePeerStore } from "@/store/peerStore";
import { FileTransferItem } from "@repo/types";

export const useTransferSetup = (
  fileInputRef: React.RefObject<HTMLInputElement | null>,
) => {
  const roomId = usePeerStore((state) => state.roomId);
  const isRoomJoined = usePeerStore((state) => state.isRoomJoined);
  const setFileTransferItems = useFileTransferStore(
    (state) => state.setFileTransferItems,
  );

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
        progressBytes: 0,
        speed: 0,
        eta: 0,
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
