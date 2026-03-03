import jwt from "jsonwebtoken";
import User from "../Models/User.js";

const protect = async (req, res, next) => {
  let token = req.cookies.token; // If using cookies

  if (!token && req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1]; // If using Bearer token
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

export default protect;