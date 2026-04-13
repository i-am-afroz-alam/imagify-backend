import jwt from "jsonwebtoken";

const userAuth = (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.json({ success: false, message: "No Token Provided" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (decodedToken) {
      req.userId = decodedToken.id;
    } else {
      return res.json({
        success: false,
        message: "Invalid Token. Login Again",
      });
    }

    next();
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export default userAuth;
