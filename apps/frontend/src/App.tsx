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
  const { randomUUID } = new ShortUniqueId({ length: 5 });

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
            type: "ice-candidate",
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
          console.log("url", url);
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
          type: "offer",
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
    console.log("pcref", pcRef, socketRef);
    try {
      await pcRef.current?.setRemoteDescription(offer);
      const answer = await pcRef.current?.createAnswer();
      await pcRef.current?.setLocalDescription(answer);

      socketRef.current?.send(
        JSON.stringify({
          type: "answer",
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
    console.log("answer", answer);
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
        case "user-joined": {
          setRemotePeerId(data.remotePeerId);

          const pc = createRTCPeerConnection();
          createDataChannel(pc);
          createAndSendOffer(pc);
          break;
        }

        case "room-joined": {
          setRemotePeerId(data.remotePeerId);
          const pc = createRTCPeerConnection();
          listenOnDataChannel(pc);
          break;
        }

        case "ice-candidate":
          handleIceCandidate(data.candidate);
          break;

        case "offer":
          handleOffer(data.offer);
          break;

        case "answer":
          console.log("answer", data);
          handleAnswer(data.answer);

          break;
      }
    };
    return () => ws.close();
  }, []);

  const handleSend = () => {
    setType("send");
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "create",
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
          type: "join",
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
    console.log("here in send file ", selectedFiles);
    for (const file of selectedFiles) {
      console.log("here in send file ", selectedFiles);
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
                  console.log(e.target.files);
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
