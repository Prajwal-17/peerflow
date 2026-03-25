"use client";

import useSignalling from "@/hooks/useSignalling";
import { peerSession } from "@/lib/peerSession";
import { useFileTransferStore } from "@/store/fileTransferStore";
import { usePeerStore } from "@/store/peerStore";
import { SOCKET_EVENT } from "@repo/types";
import { useEffect } from "react";

export default function Home() {
  const roomId = usePeerStore((state) => state.roomId);
  const setRoomId = usePeerStore((state) => state.setRoomId);
  const localPeerId = usePeerStore((state) => state.localPeerId);
  const setLocalPeerId = usePeerStore((state) => state.setLocalPeerId);
  const remotePeerId = usePeerStore((state) => state.remotePeerId);

  const type = usePeerStore((state) => state.type);
  const setType = usePeerStore((state) => state.setType);
  const selectedFiles = usePeerStore((state) => state.selectedFiles);
  const setSelectedFiles = usePeerStore((state) => state.setSelectedFiles);
  const isIncomingFile = useFileTransferStore((state) => state.isIncomingFile);
  const pendingFile = useFileTransferStore((state) => state.pendingFile);

  const { isConnected } = useSignalling();

  const handleSend = () => {
    setType("send");
    if (peerSession.socket?.readyState === WebSocket.OPEN) {
      peerSession.socket?.send(
        JSON.stringify({
          type: SOCKET_EVENT.CREATE_ROOM,
          roomId: peerSession.roomId,
          localPeerId: peerSession.localPeerId,
        }),
      );
    }
  };

  const handleJoin = () => {
    setType("receive");
    if (peerSession.socket?.readyState === WebSocket.OPEN) {
      peerSession.socket?.send(
        JSON.stringify({
          type: SOCKET_EVENT.JOIN_ROOM,
          roomId: peerSession.roomId,
          localPeerId: peerSession.localPeerId,
        }),
      );
    }
  };

  const acceptFiles = async () => {
    const dirHandler = await window.showDirectoryPicker({
      mode: "readwrite",
      startIn: "downloads",
    });
    peerSession.setDirHandler(dirHandler);

    if (pendingFile) {
      const fileHandler = await dirHandler.getFileHandle(pendingFile.name, {
        create: true,
      });
      peerSession.setfileHandler(fileHandler);

      const writable = await fileHandler.createWritable();
      peerSession.setWritableStream(writable);
      useFileTransferStore.getState().setIsIncomingFile(false);

      peerSession.ctrlChannel?.send(
        JSON.stringify({
          type: "ready",
        }),
      );
    }
  };

  useEffect(() => {
    async function main() {
      if (pendingFile) {
        if (!peerSession.fileHandler) {
          const dirHandler = peerSession.dirHandler;
          if (!dirHandler) {
            return;
          }
          const fileHandler = await dirHandler.getFileHandle(pendingFile.name, {
            create: true,
          });

          peerSession.setfileHandler(fileHandler);

          const writable = await fileHandler.createWritable();
          peerSession.setWritableStream(writable);
          useFileTransferStore.getState().setIsIncomingFile(false);

          const value = peerSession.ctrlChannel;
          value?.send(
            JSON.stringify({
              type: "ready",
            }),
          );
        }
      }
    }
    main();
  }, [isIncomingFile, pendingFile]);

  useEffect(() => {
    // sync initial session values to UI state
    setRoomId(peerSession.roomId);
    setLocalPeerId(peerSession.localPeerId);
  }, []);

  useEffect(() => {
    peerSession.setRoomId(roomId);
  }, [roomId]);

  useEffect(() => {
    if (selectedFiles.length > 0) {
      peerSession.sendFiles(selectedFiles);
    }
  }, [selectedFiles]);

  return (
    <>
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="space-y-4">
          <div className="text-xl">File transfer</div>
          <div> Room Id - {roomId}</div>
          <div> Local Peer ID 1 - {localPeerId}</div>

          <div> Remote Peer ID 2 - {remotePeerId}</div>

          <div>
            {isConnected ? (
              <div className="text-green-300">Connected •</div>
            ) : (
              <div className="text-red-500">Disconnected</div>
            )}
          </div>
          <button
            className="rounded-lg bg-black p-2 text-white"
            onClick={handleSend}
          >
            Send
          </button>
          <button
            className="rounded-lg bg-black p-2 text-white"
            onClick={() => setType("receive")}
          >
            Receive
          </button>
          {type === "receive" && (
            <div className="space-x-2">
              <label htmlFor="roomid">Room Id</label>
              <input
                id="roomid"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="border"
              />
              <button
                onClick={() => handleJoin()}
                className="rounded-lg bg-black p-2 text-white"
              >
                Join Room
              </button>
            </div>
          )}
          <div>
            <input
              type="file"
              title="send files"
              onChange={(e) => {
                if (e.target.files) {
                  const filesArray = Array.from(e.target.files);
                  setSelectedFiles(filesArray);
                }
              }}
              className="border-2"
              multiple
            />
          </div>
          {isIncomingFile && (
            <>
              <div className="space-x-5">
                <span>{pendingFile?.name}</span>
                <span>{pendingFile?.fileType}</span>
              </div>
              <button onClick={acceptFiles}>Accept Files</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
