import { Schema, model, models } from "mongoose";

export interface ParticipantDocument {
  sessionCode: string;
  playerId: string;
  username: string;
  joinedAt: Date;
}

const ParticipantSchema = new Schema<ParticipantDocument>(
  {
    sessionCode: { type: String, required: true, index: true },
    playerId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const Participant =
  models.Participant ||
  model<ParticipantDocument>("Participant", ParticipantSchema);
