import mongoose from "mongoose";
import { useState } from "react";

const connectDB = async (isconnected) => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to server/.env before starting the server.",
    );
  }

  const connectionString =
    mongoUri.startsWith("mongodb://") || mongoUri.startsWith("mongodb+srv://")
      ? mongoUri
      : `mongodb://${mongoUri}`;

  mongoose.connection.on("connected", () => {
    isconnected = true;
    console.log("MongoDB Connected Successfully...");
  });
  await mongoose.connect(`${connectionString}/imagify`);
};

export default { connectDB, connected };
