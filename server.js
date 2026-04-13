import express from "express";
import cors from "cors";
import "dotenv/config";
import userRouter from "./Routes/userRoutes.js";

import connectDB from "./config/mongodb.js";
import imageRouter from "./Routes/imageRoutes.js";

const PORT = process.env.PORT || 9000;
const app = express();

app.use(express.json());
app.use(cors());

let isconnected = false;
// await connectDB();

app.use(async (req, res, next) => {
  if (isconnected) {
    await connectDB(isconnected);
  }
  next();
});

app.use("/api/users", userRouter);

app.use("/api/image", imageRouter);

app.get("/", (req, res) => res.send("API is running fine and good...."));

// app.listen(PORT, () =>
//   console.log(`Server is running on port http://localhost:${PORT}`),
// );

module.exports = app;
