import mongoose from "mongoose";

export let connected = false;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is not set. Set it in Vercel environment variables.",
    );
  }

  const connectionString =
    mongoUri.startsWith("mongodb://") || mongoUri.startsWith("mongodb+srv://")
      ? mongoUri
      : `mongodb://${mongoUri}`;

  mongoose.connection.on("connected", () => {
    connected = true;
    console.log("MongoDB Connected Successfully...");
  });
  await mongoose.connect(`${connectionString}/imagify`);
};

export default connectDB;
