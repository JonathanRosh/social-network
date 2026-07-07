import type { Server as HttpServer } from "node:http";
import type { IncomingMessage } from "node:http";
import { Server } from "socket.io";
import { sessionMiddleware } from "../session.js";
import { getViewablePostOrThrow } from "../modules/posts/service.js";

interface RequestWithSession extends IncomingMessage {
  session?: { userId?: string };
}

let io: Server | undefined;

/**
 * Socket.IO authenticates using the exact same session cookie as REST — no
 * separate token. `io.engine.use` runs the same express-session middleware
 * on the WS handshake request, so `socket.request.session` is populated
 * from the browser's existing cookie before the connection is accepted.
 */
export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN ?? true, credentials: true },
  });

  io.engine.use(sessionMiddleware);

  io.use((socket, next) => {
    const userId = (socket.request as RequestWithSession).session?.userId;
    if (!userId) {
      next(new Error("unauthorized"));
      return;
    }
    socket.data.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    // A client can only join a post's comment room if it can currently see
    // that post — otherwise a private/friends-only post's comment stream
    // could leak to someone who shouldn't see it exists.
    socket.on("post:join", async (postId: unknown, ack?: (ok: boolean) => void) => {
      if (typeof postId !== "string") {
        ack?.(false);
        return;
      }
      try {
        await getViewablePostOrThrow(postId, userId);
        socket.join(`post:${postId}`);
        ack?.(true);
      } catch {
        ack?.(false);
      }
    });

    socket.on("post:leave", (postId: unknown) => {
      if (typeof postId === "string") {
        socket.leave(`post:${postId}`);
      }
    });
  });

  return io;
}

export function getIo(): Server {
  if (!io) throw new Error("Socket.IO not initialized — call initSocket first");
  return io;
}
