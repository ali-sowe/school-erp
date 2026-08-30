// Services call these to push a live update after a message/announcement is
// already persisted via REST (REST is the source of truth — see the
// Messaging module design note in schema.js). If no socket server is
// running (e.g. in tests), these are silent no-ops rather than throwing,
// so business logic never has to know or care whether sockets are up.

let ioInstance = null;

export function setIO(io) {
    ioInstance = io;
}

export function emitToRoom(room, event, payload) {
    if (!ioInstance) return;
    ioInstance.to(room).emit(event, payload);
}

export function emitToUser(userId, event, payload) {
    emitToRoom(`user:${userId}`, event, payload);
}

export function emitToUsers(userIds, event, payload) {
    for (const userId of userIds) {
        emitToUser(userId, event, payload);
    }
}

export function emitToSchool(schoolId, event, payload) {
    emitToRoom(`school:${schoolId}`, event, payload);
}
