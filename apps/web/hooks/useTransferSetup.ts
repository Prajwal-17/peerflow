import { peerSession } from "@/lib/peerSession";
import { usePeerStore } from "@/store/peerStore";
import { useEffect } from "react";

export const useTransferSetup = (
  dropdownRef: React.RefObject<HTMLDivElement | null>,
  fileInputRef: React.RefObject<HTMLInputElement | null>,
  setIsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const roomId = usePeerStore((state) => state.roomId);
  const isRoomJoined = usePeerStore((state) => state.isRoomJoined);

  // const setRoomId = usePeerStore((state) => state.setRoomId);
  // const peerType = usePeerStore((state) => state.peerType);
  // const setPeerType = usePeerStore((state) => state.setPeerType);
  const selectedFiles = usePeerStore((state) => state.selectedFiles);
  const setSelectedFiles = usePeerStore((state) => state.setSelectedFiles);

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

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filesArray = Array.from(files);
    // console.log("files array", filesArray);
    setSelectedFiles(filesArray);

    if (roomId && isRoomJoined) return;
    peerSession.createRoomAndJoin();
  };

  // const createAndJoinRoom = () => {
  //   // if (usePeerStore.getState().isRoomJoined) return;
  //   // optimistically set to true
  //   // usePeerStore.getState().setIsRoomJoined(true);
  //   // const currentRoomId = roomId || peerSession.roomId;
  //   // Save it to the UI store so the user can see it
  //   // if (!roomId) {
  //   //   setRoomId(currentRoomId);
  //   // }
  //   // if (peerSession.socket?.readyState === WebSocket.OPEN) {
  //   //   peerSession.socket?.send(
  //   //     JSON.stringify({
  //   //       type: SOCKET_EVENT.CREATE_ROOM,
  //   //       roomId: currentRoomId,
  //   //       localPeerId: peerSession.localPeerId,
  //   //     }),
  //   //   );
  //   // }
  // };

  useEffect(() => {
    if (selectedFiles.length > 0) {
      console.log(selectedFiles);
      // create & join a room
      // peerSession.
      //
      //
      // peerSession.sendFiles(selectedFiles);
    }
  }, [selectedFiles]);

  // Only update peerSession if roomId is actually set in the store
  // useEffect(() => {
  //   if (roomId) {
  //     peerSession.setRoomId(roomId);
  //   }
  // }, [roomId]);

  const handleChooseSavedItems = () => {};

  return {
    // createAndJoinRoom,
    handleFilesSelected,
    handleChooseFromDevice,
    handleChooseSavedItems,
  };
};
