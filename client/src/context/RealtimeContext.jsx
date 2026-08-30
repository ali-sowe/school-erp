import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

const RealtimeContext = createContext(null);

// The socket.io handshake needs a raw JWT (see server/realtime/socket.js —
// `auth: { token }`), but this app deliberately never exposes the access
// token to JS otherwise (httpOnly cookie only, so XSS can't read it — see
// services/api.js). /auth/refresh is the one endpoint that returns a raw
// token in its response body regardless of how the session started (fresh
// login or a cookie-restored session), so it's used here purely to mint a
// token for this one handshake — never persisted, held only in the socket
// instance's own auth config for the life of the connection.
function useSocketConnection(user) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    let cancelled = false;
    let socketInstance = null;

    (async () => {
      try {
        const response = await api.post('/auth/refresh');
        const token = response.data?.data?.token;
        if (cancelled || !token) return;

        const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
        socketInstance = io(socketUrl, { auth: { token }, withCredentials: true });
        setSocket(socketInstance);
      } catch {
        // No live-update connection this session — every realtime hook below
        // treats a null socket as "not connected yet" and simply doesn't
        // subscribe, so the rest of the app (which fetches over plain REST)
        // keeps working normally without it.
      }
    })();

    return () => {
      cancelled = true;
      socketInstance?.disconnect();
      setSocket(null);
    };
  }, [user]);

  return socket;
}

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const socket = useSocketConnection(user);
  const socketRef = useRef(socket);
  socketRef.current = socket;

  return <RealtimeContext.Provider value={socket}>{children}</RealtimeContext.Provider>;
}

// Returns the live socket instance, or null if not connected yet/at all —
// every caller (useRealtimeEvent below, or a direct consumer) has to handle
// the null case, same as any other "still loading" state in this app.
export function useSocket() {
  return useContext(RealtimeContext);
}

// Subscribes to one event for the lifetime of the calling component,
// re-subscribing if the socket instance itself changes (e.g. reconnect).
// `handler` is intentionally not in the dependency array — callers pass an
// inline function, and re-subscribing on every render would thrash the
// socket's listener list for no benefit; the ref keeps the latest closure
// without that cost.
export function useRealtimeEvent(event, handler) {
  const socket = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return undefined;

    const listener = (...args) => handlerRef.current(...args);
    socket.on(event, listener);

    return () => socket.off(event, listener);
  }, [socket, event]);
}
