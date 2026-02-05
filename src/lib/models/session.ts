import { Schema, model, models } from "mongoose";

export type SessionStatus = "lobby" | "running" | "ended";

export interface SessionDocument {
  code: string;
  status: SessionStatus;
  maxPlayers?: number;
  createdBy?: string;
  createdAt: Date;
  expiresAt: Date;
}

const SessionSchema = new Schema<SessionDocument>(
  {
    code: { type: String, required: true, unique: true },
    status: { type: String, required: true, default: "lobby" },
    maxPlayers: { type: Number },
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false }
);

export const Session =
  models.Session || model<SessionDocument>("Session", SessionSchema);
