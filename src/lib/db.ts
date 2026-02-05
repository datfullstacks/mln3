import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected || mongoose.connection.readyState >= 1) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment");
  }

  await mongoose.connect(uri);
  isConnected = true;
}
