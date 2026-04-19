import { SOCKET_EVENT } from "@repo/types";
import { DurableObject } from "cloudflare:workers";
import { Env } from "hono";
import ShortUniqueId from "short-unique-id";

type ConnectionState = {
  roomId: string | null;
  peerId: string | null;
};

export class Signalling extends DurableObject<Env> {
  // roomId , peerId, WebSocket
  rooms = new Map<string, Map<string, WebSocket>>();
  uid = new ShortUniqueId({
    dictionary: "alpha_upper",
    length: 5,
  });

  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.ctx.acceptWebSocket(server!);

    server?.serializeAttachment({ roomId: null, peerId: null });
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  broadcastToRoom = (roomId: string, localPeerId: string, payload: any) => {
    const room = this.rooms.get(roomId);
    if (!room) return;
    for (const [peerId, ws] of room.entries()) {
      if (peerId !== localPeerId) {
        ws.send(JSON.stringify({ ...payload }));
      }
    }
  };

  webSocketMessage(ws: WebSocket, message: string): void | Promise<void> {
    const data = JSON.parse(message);
    const { type, roomId, localPeerId, ...rest } = data;

    let attachment = ws.deserializeAttachment() as ConnectionState;
    attachment.peerId = localPeerId;

    // switch
    switch (type) {
      case SOCKET_EVENT.CREATE_ROOM: {
        const newRoomId = this.uid.randomUUID();

        attachment.roomId = newRoomId;
        ws.serializeAttachment(attachment);
        // currentRoomId = newRoomId;

        this.rooms.set(newRoomId, new Map());
        const room = this.rooms.get(newRoomId);
        room?.set(localPeerId, ws); // auto join sender
        ws.send(
          JSON.stringify({
            type: SOCKET_EVENT.ROOM_JOINED,
            roomId: newRoomId,
            redirect: true, // redirect to /roomId/send
            msg: "Successfully joined room",
          }),
        );
        break;
      }

      case SOCKET_EVENT.JOIN_ROOM: {
        if (!roomId || !this.rooms.has(roomId)) {
          ws.send(
            JSON.stringify({
              type: SOCKET_EVENT.ERROR,
              msg: "Room not found",
            }),
          );
        }
        attachment.roomId = roomId;
        ws.serializeAttachment(attachment);

        const room = this.rooms.get(roomId);
        room?.set(localPeerId, ws as any);
        ws.send(
          JSON.stringify({
            type: SOCKET_EVENT.ROOM_JOINED,
            roomId: roomId,
            redirect: false, // redirect to /roomId/receive
            msg: "Joined",
          }),
        );

        this.broadcastToRoom(roomId, localPeerId, {
          type: SOCKET_EVENT.PEER_JOINED,
          remotePeerId: localPeerId,
        });

        break;
      }

      case SOCKET_EVENT.OFFER:
      case SOCKET_EVENT.ANSWER:
      case SOCKET_EVENT.ICE_CANDIDATE: {
        this.broadcastToRoom(roomId, localPeerId, {
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
  }

  webSocketClose(ws: WebSocket): void | Promise<void> {
    const { roomId, peerId } = ws.deserializeAttachment() as ConnectionState;

    if (roomId && peerId) {
      const room = this.rooms.get(roomId);

      room?.delete(peerId);

      if (room?.size === 0) {
        this.rooms.delete(roomId);
      } else {
        this.broadcastToRoom(roomId, peerId, {
          type: SOCKET_EVENT.LEAVE_ROOM,
          peerId: peerId,
        });
      }
    }
  }
}
