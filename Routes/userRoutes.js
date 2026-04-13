import express from "express";
import {
  userRegister,
  userLogin,
  userCredit,
  paymentController,
  verifyRazorpay,
} from "../Controllers/userController.js";
import userAuth from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.post("/register", userRegister);
userRouter.post("/login", userLogin);
userRouter.get("/credits", userAuth, userCredit);
userRouter.post("/pay-razor", userAuth, paymentController);
userRouter.post("/verify-razorpay", verifyRazorpay);

export default userRouter;
