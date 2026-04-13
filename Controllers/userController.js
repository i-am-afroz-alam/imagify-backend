import userModel from "../Models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import razorpay from "razorpay";
import transactionModel from "../Models/transactionModel.js";

const userRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User Already Exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    console.log(hashedPassword);

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
      success: true,
      token,
      user: { name: user.name },
      password: hashedPassword,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User Not Found" });
    }
    if (!process.env.JWT_SECRET) {
      return res.json({ success: false, message: "JWT_SECRET is not set" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      res.json({ success: true, token, user: { name: user.name } });
    } else {
      res.json({ success: false, message: "Invalid Credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "An error occurred" });
  }
};

const userCredit = async (req, res) => {
  try {
    const { userId } = req;
    const user = await userModel.findById(userId);

    res.json({
      success: true,
      credit: user.creditBalance,
      user: { name: user.name },
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentController = async (req, res) => {
  try {
    const { userId } = req;
    const { planId } = req.body;
    console.log("userId" + userId + "planId" + planId);

    const user = await userModel.findById(userId);

    if (!user || !planId) {
      return res.json({ success: false, message: "Missing Details" });
    }

    let amount, credits, plan, date;

    switch (planId) {
      case "Basic":
        plan = "Basic";
        credits = 100;
        amount = 100;

        break;

      case "Advanced":
        plan = "Advanced";
        credits = 500;
        amount = 50;

        break;

      case "Business":
        plan = "Business";
        credits = 5000;
        amount = 250;

        break;

      default:
        res.json({ success: false, message: "Invalid Plan Id" });
    }
    date = Date.now();

    //here we have created a transactionData object that contains the details of the transaction, such as the user ID, plan, credit, amount, and date. This object will be used to create a new transaction entry in the database using the transactionModel.
    const transactionData = { userId, plan, credits, amount, date };

    //we have used the create method of the transactionModel to create a new transaction entry in the database with the transactionData object. This will allow us to keep track of all transactions made by users, including the plan they purchased, the amount paid, and the credits added to their account.
    const newTransaction = await transactionModel.create(transactionData);

    const options = {
      amount: amount * 100,
      currency: process.env.CURRENCY,
      receipt: newTransaction._id,
    };

    await razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
      }
      res.json({ success: true, order });
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//this functon will be called after the payment is completed successfully. It will receive the response from Razorpay which contains the payment id, order id, and signature. We can use this information to verify the payment on the backend and then update the user's credit balance accordingly. After that, we can call the loadCreditData function to refresh the credit balance in the frontend and show a success message to the user.
const verifyRazorpay = async (req, res) => {
  try {
    //this will store the order id which we put in the receipt field while creating the order in Razorpay
    const { razorpay_order_id } = req.body;

    //using the order id we will fetch the order details from Razorpay to check if the payment was successful or not. If the payment was successful, we will update the transaction entry in the database to mark it as paid and then update the user's credit balance accordingly.
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    //in this if we are checking if the payment was successful by checking the status of the order. If the status is "paid", then we will get the transaction data from the database using the order id which we stored in the receipt field while creating the order in Razorpay. Then we will check if the payment is already verified or not to avoid duplicate verification. If not verified, we will update the user's credit balance by adding the credits from the transaction data and then mark the transaction as verified in the database. Finally, we will send a success response back to the frontend.
    if (orderInfo.status === "paid") {
      const transactionData = await transactionModel.findById(
        orderInfo.receipt,
      );

      if (transactionData.paymentVerified) {
        return res.json({
          success: false,
          message: "Payment Already Verified or failed",
        });
      }

      //if the payment is successful and not verified yet, we will update the user's credit balance by adding the credits from the transaction data and then mark the transaction as verified in the database. Finally, we will send a success response back to the frontend.
      const userData = await userModel.findById(transactionData.userId);
      const creditBalance = userData.creditBalance + transactionData.credits;

      //here we are updating the user's credit balance in the database by adding the credits from the transaction data to the existing credit balance of the user. This will ensure that the user's credit balance is updated correctly after a successful payment.
      await userModel.findByIdAndUpdate(userData._id, { creditBalance });

      //here we are updating the transaction entry in the database to mark it as verified by setting the paymentVerified field to true. This will help us keep track of which transactions have been successfully verified and which ones are still pending or failed.
      await transactionModel.findByIdAndUpdate(transactionData._id, {
        paymentVerified: true,
      });

      res.json({ success: true, message: "Credits Added" });
    } else {
      res.json({ success: false, message: "Payment Verification Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  userRegister,
  userLogin,
  userCredit,
  paymentController,
  verifyRazorpay,
};
