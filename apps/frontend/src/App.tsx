import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

function App() {
  const [websocket, setWebsocket] = useState<WebSocket>();
  const [roomId, setRoomId] = useState("");
  const [peerId1, setPeerId1] = useState(uuid());
  const [peerId2, setPeerId2] = useState("");
  const [type, setType] = useState<"send" | "receive">();
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const ws = new WebSocket("http://localhost:3000/ws");
    ws.onopen = (event) => {
      console.log(event);
    };
  }, []);

  const handleSend = () => {
    setType("send");
    const ws = new WebSocket("http://localhost:3000/ws");
    ws.onopen = () => {
      console.log("connected");
      setIsConnected(true);
    };
  };

  return (
    <>
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="space-y-4">
          <div className="text-xl">File transfer</div>
          <div> Room Id -{roomId}</div>
          <div> Peer ID 1 -{peerId1}</div>

          <div> Peer ID 2 -{peerId2}</div>

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
              <button className="bg-black text-white  p-2 rounded-lg">
                Join Room
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
