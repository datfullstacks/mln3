import type { Server as IOServer } from "socket.io";

declare global {
  var io: IOServer | undefined;
}

export function setIO(io: IOServer) {
  globalThis.io = io;
}

export function getIO() {
  return globalThis.io;
}
