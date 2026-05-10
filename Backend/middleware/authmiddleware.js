import jwt from "jsonwebtoken";
import User from "../Models/User.js";

// Change 'const' to 'export const' for Named Export
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.userId = req.user._id.toString(); 
      next();
    } catch (error) {
      console.error("AUTH ERROR:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// --- ADD THIS NEW NAMED EXPORT ---
export const authorize = (...roles) => {
  return (req, res, next) => {
    // req.user is populated by the 'protect' middleware above
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Role '${req.user?.role}' is not authorized to access this resource` 
      });
    }
    next();
  };
};