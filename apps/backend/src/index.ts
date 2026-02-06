import { Hono } from "hono";
import { upgradeWebSocket, websocket } from "hono/bun";
import type { WSContext } from "hono/ws";

const app = new Hono();

// roomId , peerId, WebSocket
const rooms = new Map<string, Map<string, WSContext>>();

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        const data = JSON.parse(event.data.toString());

        // validate roomId || peerId

        const roomExists = rooms.has(data.roomId);
        if (!roomExists) {
          rooms.set(data.roomId, new Map());
          const room = rooms.get(data.roomId);
          room?.set(data.peerId, ws);
        }

        const room = rooms.get(data.roomId);
        room?.set(data.peerId, ws);

        const size = rooms.size;

        ws.send(
          JSON.stringify({
            type: "joined",
            msg: "successfully joined room",
          }),
        );

        if (size > 1) {
        }
      },
    };
  }),
);

const server = Bun.serve({
  fetch: app.fetch,
  port: 3000,
  websocket,
});

export default app;
