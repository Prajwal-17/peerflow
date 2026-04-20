import { SOCKET_EVENT } from "@repo/types";
import { DurableObject } from "cloudflare:workers";
import { Env } from "hono";
import ShortUniqueId from "short-unique-id";

type ConnectionState = {
  roomId: string | null;
  peerId: string | null;
};

export class Signalling extends DurableObject<Env> {
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
    const sockets = this.ctx.getWebSockets();

    for (const socket of sockets) {
      const attachment = socket.deserializeAttachment() as ConnectionState;

      if (
        attachment &&
        attachment.roomId === roomId &&
        attachment.peerId !== localPeerId
      ) {
        socket.send(JSON.stringify(payload));
      }
    }
  };

  webSocketMessage(ws: WebSocket, message: string): void | Promise<void> {
    const data = JSON.parse(message);
    const { type, roomId, localPeerId, ...rest } = data;

    let attachment = ws.deserializeAttachment() as ConnectionState;
    attachment.peerId = localPeerId;

    switch (type) {
      case SOCKET_EVENT.CREATE_ROOM: {
        const newRoomId = this.uid.randomUUID();

        attachment.roomId = newRoomId;
        ws.serializeAttachment(attachment);

        ws.send(
          JSON.stringify({
            type: SOCKET_EVENT.ROOM_JOINED,
            roomId: newRoomId,
            redirect: true,
            msg: "Successfully joined room",
          }),
        );
        break;
      }

      case SOCKET_EVENT.JOIN_ROOM: {
        const sockets = this.ctx.getWebSockets();

        let roomExists = false;
        for (const socket of sockets) {
          const targetAttachment =
            socket.deserializeAttachment() as ConnectionState;
          if (targetAttachment && targetAttachment.roomId === roomId) {
            roomExists = true;
            break;
          }
        }

        if (!roomExists) {
          ws.send(
            JSON.stringify({
              type: SOCKET_EVENT.ERROR,
              msg: "Room not found",
            }),
          );
          break;
        }

        attachment.roomId = roomId;
        ws.serializeAttachment(attachment);

        ws.send(
          JSON.stringify({
            type: SOCKET_EVENT.ROOM_JOINED,
            roomId: roomId,
            redirect: false,
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
    const attachment = ws.deserializeAttachment() as ConnectionState;
    if (!attachment) return;

    const { roomId, peerId } = attachment;

    if (roomId && peerId) {
      const sockets = this.ctx.getWebSockets();

      let roomStillHasPeers = false;
      for (const socket of sockets) {
        const targetAttachment =
          socket.deserializeAttachment() as ConnectionState;
        if (targetAttachment && targetAttachment.roomId === roomId) {
          roomStillHasPeers = true;
          break;
        }
      }

      if (roomStillHasPeers) {
        this.broadcastToRoom(roomId, peerId, {
          type: SOCKET_EVENT.LEAVE_ROOM,
          peerId: peerId,
        });
      }
    }
  }
}
