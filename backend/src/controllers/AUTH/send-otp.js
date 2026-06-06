import bcrypt from "bcryptjs";
import { redis } from "../../config/redis.js";
import { generateOTP } from "./generateOTP.js";
import { sendEmail } from "../../utils/sendEmail.js"; // fixed path

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const otp = generateOTP();

    const hashedOTP = await bcrypt.hash(otp, 10);

    await redis.set(`otp:${email}`, hashedOTP, {
      EX: 300, // expires in 5 minutes
    });

    await sendEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};