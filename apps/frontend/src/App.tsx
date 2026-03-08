import { SOCKET_EVENT } from "@repo/types";
import { useEffect } from "react";
import useSignalling from "./hooks/useSignalling";
import { roomIdRef, socketRef } from "./lib/ref";
import { handleSendFile } from "./lib/transfer";
import { useFileTransferStore } from "./store/fileTransferStore";
import { usePeerStore } from "./store/peerStore";

function App() {
  const roomId = usePeerStore((state) => state.roomId);
  const setRoomId = usePeerStore((state) => state.setRoomId);
  const localPeerId = usePeerStore((state) => state.localPeerId);
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
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: SOCKET_EVENT.CREATE_ROOM,
          roomId: roomIdRef.current,
          localPeerId: localPeerId,
        }),
      );
    }
  };

  const handleJoin = () => {
    setType("receive");
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: SOCKET_EVENT.JOIN_ROOM,
          roomId: roomIdRef.current,
          localPeerId: localPeerId,
        }),
      );
    }
  };

  const acceptFiles = async () => {
    if (pendingFile) {
      const saveHandler = await window.showSaveFilePicker({
        suggestedName: pendingFile.name,
      });

      const writable = await saveHandler.createWritable();
      useFileTransferStore.getState().setWritableStream(writable);
      const value = useFileTransferStore.getState().ctrlChannel;
      value?.send(
        JSON.stringify({
          type: "ready",
        }),
      );
    }
  };

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    if (selectedFiles.length > 0) {
      handleSendFile(selectedFiles);
    }
  }, [selectedFiles]);

  return (
    <>
      <div className="min-h-screen w-full flex items-center justify-center">
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
            className="bg-black text-white  p-2 rounded-lg"
            onClick={handleSend}
          >
            Send
          </button>
          <button
            className="bg-black text-white  p-2 rounded-lg"
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
                className="bg-black text-white  p-2 rounded-lg"
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
            <button onClick={acceptFiles}>Accept Files</button>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
