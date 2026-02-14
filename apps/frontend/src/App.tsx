import { SOCKET_EVENT } from "@repo/types";
import { useEffect, useRef, useState } from "react";
import ShortUniqueId from "short-unique-id";

const config = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

function App() {
  const { randomUUID } = new ShortUniqueId({
    dictionary: "alpha_upper",
    length: 5,
  });

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  const [roomId, setRoomId] = useState(randomUUID());
  const [localPeerId, setLocalPeerId] = useState(randomUUID(16));
  const [remotePeerId, setRemotePeerId] = useState("");
  const [type, setType] = useState<"send" | "receive">();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.log(error);
    }
  };

  const createRTCPeerConnection = () => {
    const pc = new RTCPeerConnection(config);
    pcRef.current = pc;

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        socketRef.current?.send(
          JSON.stringify({
            type: SOCKET_EVENT.ICE_CANDIDATE,
            roomId: roomIdRef.current,
            localPeerId: localPeerId,
            candidate: event.candidate,
          }),
        );
      }
    };
    return pc;
  };

  const listenOnDataChannel = (pc: RTCPeerConnection) => {
    pc.ondatachannel = (event) => {
      const channel = event.channel;
      let pendingFileMeta: { name: string; fileType: string } | null = null;
      channel.onmessage = (msgEvent) => {
        const { data } = msgEvent;
        if (typeof data == "string") {
          const parsed = JSON.parse(data);
          if (parsed.type === "file-meta") {
            pendingFileMeta = parsed;
          }
        } else {
          const tempData = new Blob([data], { type: "application/pdf" });
          const url = URL.createObjectURL(tempData);
          const a = document.createElement("a");
          a.href = url;
          a.download = "";
          a.click();
          URL.revokeObjectURL(url);
        }
      };
    };
  };

  const createDataChannel = (pc: RTCPeerConnection) => {
    const dc = pc.createDataChannel("file-transfer", {
      ordered: true,
    });
    dc.onopen = () => {
      console.log("data channel opened");
    };
    dcRef.current = dc;
  };

  const createAndSendOffer = async (pc: RTCPeerConnection) => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.send(
        JSON.stringify({
          type: SOCKET_EVENT.OFFER,
          roomId: roomIdRef.current,
          localPeerId,
          offer,
        }),
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      await pcRef.current?.setRemoteDescription(offer);
      const answer = await pcRef.current?.createAnswer();
      await pcRef.current?.setLocalDescription(answer);

      socketRef.current?.send(
        JSON.stringify({
          type: SOCKET_EVENT.ANSWER,
          roomId: roomIdRef.current,
          localPeerId,
          answer: answer,
        }),
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      await pcRef.current?.setRemoteDescription(answer);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    ws.onopen = () => {
      socketRef.current = ws;
      setIsConnected(true);
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case SOCKET_EVENT.PEER_JOINED: {
          setRemotePeerId(data.remotePeerId);

          const pc = createRTCPeerConnection();
          createDataChannel(pc);
          createAndSendOffer(pc);
          break;
        }

        case SOCKET_EVENT.ROOM_JOINED: {
          setRemotePeerId(data.remotePeerId);
          const pc = createRTCPeerConnection();
          listenOnDataChannel(pc);
          break;
        }

        case SOCKET_EVENT.ICE_CANDIDATE:
          handleIceCandidate(data.candidate);
          break;

        case SOCKET_EVENT.OFFER:
          handleOffer(data.offer);
          break;

        case SOCKET_EVENT.ANSWER:
          handleAnswer(data.answer);

          break;
      }
    };
    ws.onclose = () => {
      socketRef.current = null;
      setIsConnected(false);
    };

    return () => ws.close();
  }, []);

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

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const handleSendFile = async () => {
    for (const file of selectedFiles) {
      const metadata = JSON.stringify({
        type: "file-meta",
        name: file.name,
        fileType: file.type,
        size: file.size,
      });
      dcRef.current?.send(metadata);
      const buffer = await file.arrayBuffer();
      dcRef.current?.send(buffer);
    }
  };

  useEffect(() => {
    if (selectedFiles.length > 0) {
      handleSendFile();
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
          <button onClick={handleSendFile}>Send File</button>
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
                  setSelectedFiles((prev) => [...prev, ...filesArray]);
                }
              }}
              className="border-2"
              multiple
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
