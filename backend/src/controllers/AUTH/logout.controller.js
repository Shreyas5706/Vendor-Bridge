import jwt from "jsonwebtoken";
import { redis } from "../../config/redis.js";

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No active session found to logout",
      });
    }

    // Decode token to find out when it expires
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // If token is already expired or invalid, just clear the cookie and return success
      res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
      return res.status(200).json({
        success: true,
        message: "Successfully logged out (token was invalid/expired)",
      });
    }

    // Calculate remaining time until token expires in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp - currentTime;

    // If token hasn't expired yet, add it to Redis blacklist
    if (expiresIn > 0) {
      // SETEX key seconds value
      await redis.setEx(`bl_${token}`, expiresIn, "blacklisted");
    }

    // Clear the HTTP-only cookie
    res.clearCookie("token", { httpOnly: true, sameSite: "strict" });

    return res.status(200).json({
      success: true,
      message: "Successfully logged out securely",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: error.message,
    });
  }
};
