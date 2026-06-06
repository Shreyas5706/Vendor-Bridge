import bcrypt from "bcryptjs";
import Company from "../../models/company.model.js";
import Manager from "../../models/manager.model.js";
import PurchaseOfficer from "../../models/po.model.js";
import { checkOTP } from "./verifyOTP.js";

/**
 * Reset password controller using OTP.
 * Expects email, otp, and newPassword in the request body.
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    // 1. Verify the OTP
    const otpVerification = await checkOTP(email, otp);
    if (!otpVerification.valid) {
      return res.status(400).json({
        success: false,
        message: otpVerification.reason,
      });
    }

    const lowercaseEmail = email.toLowerCase().trim();

    // 2. Find the user (Vendors do not have passwords, so skip them)
    let user = await Company.findOne({ email: lowercaseEmail });
    if (!user) {
      user = await Manager.findOne({ email: lowercaseEmail });
    }
    if (!user) {
      user = await PurchaseOfficer.findOne({ email: lowercaseEmail });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3. Hash the new password and save
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during password reset",
      error: error.message,
    });
  }
};
