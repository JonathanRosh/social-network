import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./AuthContext.js";

const SocketContext = createContext<Socket | null>(null);

/**
 * One shared socket per logged-in session, authenticated via the same
 * session cookie as REST (the server reads it off the handshake request —
 * see backend/src/socket/index.ts). Connects only while authenticated and
 * disconnects on logout, rather than trying to juggle a second auth scheme.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }

    const s = io({ withCredentials: true });
    setSocket(s);

    return () => {
      s.close();
    };
  }, [user?.id]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
