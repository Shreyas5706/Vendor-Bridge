import jwt from "jsonwebtoken";
import { redis } from "../config/redis.js";

export const authUser = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "User Not Authenticated",
        success: false,
        err: "No token provided",
      });
    }

    // Check if token is blacklisted in Redis
    const isBlacklisted = await redis.get(`bl_${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
        err: "Token has been revoked (logged out)",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized",
      success: false,
      err: "Invalid token or session expired",
    });
  }
};