import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  credits: { type: Number, required: true },
  paymentVerified: { type: Boolean, default: false },
  date: { type: Date },
});

const transactionModel =
  mongoose.models.transaction ||
  mongoose.model("transactions", transactionSchema);

export default transactionModel;
