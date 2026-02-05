import { Schema, model, models } from "mongoose";

export interface LeaderboardEntryDocument {
  sessionCode: string;
  playerId: string;
  username: string;
  score: number;
  totalTimeMs: number;
  updatedAt: Date;
  createdAt: Date;
}

const LeaderboardSchema = new Schema<LeaderboardEntryDocument>(
  {
    sessionCode: { type: String, required: true, index: true },
    playerId: { type: String, required: true },
    username: { type: String, required: true },
    score: { type: Number, default: 0 },
    totalTimeMs: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

LeaderboardSchema.index({ sessionCode: 1, playerId: 1 }, { unique: true });

export const LeaderboardEntry =
  models.LeaderboardEntry ||
  model<LeaderboardEntryDocument>("LeaderboardEntry", LeaderboardSchema);
