import mongoose from "mongoose";

//this will be used to define the schema or structure of the user data that we will be storing in the database

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  creditBalance: { type: Number, default: 5 },
});

//based on the schema we will create a model which will be used to interact with the database and perform CRUD operations on the user data

const userModel = mongoose.models.user || mongoose.model("users", userSchema);

export default userModel;
