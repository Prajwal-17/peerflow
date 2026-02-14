import { SOCKET_EVENT } from "@repo/types";
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

        if (
          data.type === SOCKET_EVENT.CREATE_ROOM ||
          data.type === SOCKET_EVENT.JOIN_ROOM
        ) {
          const roomExists = rooms.has(data.roomId);
          if (!roomExists) {
            rooms.set(data.roomId, new Map());
            const room = rooms.get(data.roomId);
            room?.set(data.localPeerId, ws);
            ws.send(
              JSON.stringify({
                msg: "Successfully create room",
              }),
            );
            return;
          }

          const room = rooms.get(data.roomId);
          room?.set(data.localPeerId, ws);

          const remotePeerId = Array.from(room?.keys() || []).find(
            (id) => id !== data.localPeerId,
          );

          ws.send(
            JSON.stringify({
              type: SOCKET_EVENT.ROOM_JOINED,
              remotePeerId,
              msg: "Successfully joined room",
            }),
          );

          if (remotePeerId) {
            const currRoom = rooms.get(data.roomId);
            const remoteWs = currRoom?.get(remotePeerId);

            remoteWs?.send(
              JSON.stringify({
                type: SOCKET_EVENT.PEER_JOINED,
                remotePeerId: data.localPeerId,
                msg: "Successfully joined room",
              }),
            );
          }

          return;
        }

        if (data.type === SOCKET_EVENT.OFFER) {
          const room = rooms.get(data.roomId);

          const remotePeerId = Array.from(room?.keys() || []).find(
            (id) => id !== data.localPeerId,
          );

          if (remotePeerId) {
            const remoteWs = room?.get(remotePeerId);
            remoteWs?.send(
              JSON.stringify({
                type: SOCKET_EVENT.OFFER,
                roomId: data.roomId,
                localPeerId: data.localPeerId,
                offer: data.offer,
              }),
            );
          }
        }

        if (data.type === SOCKET_EVENT.ICE_CANDIDATE) {
          const room = rooms.get(data.roomId);
          // room?.set(data.localPeerId, ws);

          const remotePeerId = Array.from(room?.keys() || []).find(
            (id) => id !== data.localPeerId,
          );

          if (remotePeerId) {
            const remoteWs = room?.get(remotePeerId);
            remoteWs?.send(
              JSON.stringify({
                type: SOCKET_EVENT.ICE_CANDIDATE,
                roomId: data.roomId,
                localPeerId: data.localPeerId,
                candidate: data.candidate,
              }),
            );
          }
        }

        if (data.type === SOCKET_EVENT.ANSWER) {
          const room = rooms.get(data.roomId);

          const remotePeerId = Array.from(room?.keys() || []).find(
            (id) => id !== data.localPeerId,
          );

          if (remotePeerId) {
            const remoteWs = room?.get(remotePeerId);
            remoteWs?.send(
              JSON.stringify({
                type: SOCKET_EVENT.ANSWER,
                roomId: data.roomId,
                localPeerId: data.localPeerId,
                answer: data.answer,
              }),
            );
          }
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
