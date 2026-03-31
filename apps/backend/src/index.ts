import { SOCKET_EVENT } from "@repo/types";
import { Hono } from "hono";
import { upgradeWebSocket, websocket } from "hono/bun";
import type { WSContext } from "hono/ws";
import ShortUniqueId = require("short-unique-id");

const app = new Hono();

// roomId , peerId, WebSocket
const rooms = new Map<string, Map<string, WSContext>>();

const { randomUUID } = new ShortUniqueId({
  dictionary: "alpha_upper",
  length: 5,
});

const broadcastToRoom = (roomId: string, localPeerId: string, payload: any) => {
  const room = rooms.get(roomId);
  if (!room) return;
  for (const [peerId, ws] of room.entries()) {
    if (peerId !== localPeerId) {
      ws.send(JSON.stringify({ ...payload }));
    }
  }
};

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    let currentRoomId: string | null = null;
    let currentPeerId: string | null = null;

    return {
      onMessage(event, ws) {
        console.log("data", JSON.parse(event.data.toString()));
        const data = JSON.parse(event.data.toString());
        const { type, roomId, localPeerId, ...rest } = data;

        currentPeerId = localPeerId;

        // switch
        switch (type) {
          case SOCKET_EVENT.CREATE_ROOM: {
            const newRoomId = randomUUID();

            currentRoomId = newRoomId;

            rooms.set(newRoomId, new Map());
            const room = rooms.get(newRoomId);
            room?.set(localPeerId, ws); // auto join sender
            ws.send(
              JSON.stringify({
                type: SOCKET_EVENT.ROOM_JOINED,
                roomId: newRoomId,
                msg: "Successfully joined room",
              }),
            );
            console.log("createRoom", rooms);
            break;
          }

          case SOCKET_EVENT.JOIN_ROOM: {
            if (!roomId || !rooms?.has(roomId)) {
              ws.send(
                JSON.stringify({
                  type: SOCKET_EVENT.ERROR,
                  msg: "Room not found",
                }),
              );
            }
            currentRoomId = roomId;

            const room = rooms.get(roomId);
            room?.set(localPeerId, ws);

            ws.send(
              JSON.stringify({
                type: SOCKET_EVENT.ROOM_JOINED,
                roomId: roomId,
                msg: "Joined",
              }),
            );

            broadcastToRoom(roomId, localPeerId, {
              type: SOCKET_EVENT.PEER_JOINED,
              remotePeerId: localPeerId,
            });

            console.log("createRoom", rooms);
            break;
          }

          case SOCKET_EVENT.OFFER:
          case SOCKET_EVENT.ANSWER:
          case SOCKET_EVENT.ICE_CANDIDATE: {
            broadcastToRoom(roomId, localPeerId, {
              type: type,
              roomId: roomId,
              localPeerId: localPeerId,
              ...rest,
            });
            break;
          }

          default: {
            console.warn("Unknown Socket Event type:", type);
          }
        }
      },
      onClose() {
        if (currentRoomId && currentPeerId) {
          const room = rooms.get(currentRoomId);
          room?.delete(currentPeerId);
          if (room?.size === 0) {
            rooms.delete(currentRoomId);
          } else {
            broadcastToRoom(currentRoomId, currentPeerId, {
              type: SOCKET_EVENT.PEER_LEFT,
              peerId: currentPeerId,
            });
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
