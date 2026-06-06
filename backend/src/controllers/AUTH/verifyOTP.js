import bcrypt from "bcryptjs";
import { redis } from "../../config/redis.js";

/**
 * Internal helper to verify an OTP for a given email.
 * On success: deletes the OTP from Redis and returns { valid: true }.
 * On failure: returns { valid: false, reason: "..." }.
 * 
 * Used directly by the register controller so the user only needs
 * one API call (register) instead of two separate verify + register calls.
 */
export const checkOTP = async (email, otp) => {
  const storedHashedOTP = await redis.get(`otp:${email}`);

  if (!storedHashedOTP) {
    return { valid: false, reason: "OTP expired or not found" };
  }

  const isValid = await bcrypt.compare(otp, storedHashedOTP);

  if (!isValid) {
    return { valid: false, reason: "Invalid OTP" };
  }

  // Delete OTP from Redis after successful verification (one-time use)
  await redis.del(`otp:${email}`);

  return { valid: true };
};

/**
 * Route handler for standalone OTP verification (POST /verify-otp).
 * Can be used independently when you want a separate verify step.
 */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const result = await checkOTP(email, otp);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.reason,
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};