import { Server } from 'socket.io';
import env from '../config/env.js';
import { verifyToken } from '../helpers/jwt.helper.js';
import { normalizePermissions } from '../helpers/auth/permission.helper.js';
import { setIO } from '../helpers/realtime/realtime.helper.js';

// Every socket authenticates with the same JWT used for REST (sent as
// `auth: { token }` on the client's io() call) — no separate socket-only
// credential to keep in sync. A connection with no/invalid token is
// rejected before it ever reaches 'connection'.
function authenticateSocket(socket, next) {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error('Authentication required.'));
    }

    try {
        const decoded = verifyToken(token);
        socket.data.user = {
            ...decoded,
            permissions: normalizePermissions(decoded.permissions)
        };
        next();
    } catch (error) {
        next(new Error('Invalid or expired token.'));
    }
}

// Rooms are assigned server-side from the verified token, never from
// anything the client asks to join — same "keep business logic on the
// server" rule as everywhere else, applied to who can receive what.
function registerConnection(socket) {
    const { userId, schoolId } = socket.data.user;

    socket.join(`user:${userId}`);

    if (schoolId) {
        socket.join(`school:${schoolId}`);
    }
}

export function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: env.corsOrigin,
            credentials: true
        }
    });

    io.use(authenticateSocket);
    io.on('connection', registerConnection);

    setIO(io);

    return io;
}
