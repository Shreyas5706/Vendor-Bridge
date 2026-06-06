import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Company from "../models/company.model.js";
import Manager from "../models/manager.model.js";
import PurchaseOfficer from "../models/po.model.js";

/**
 * Basic login controller
 * Takes email and password, checks in Company, Manager, and PurchaseOfficer collections
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const lowercaseEmail = email.toLowerCase().trim();

    // 2. Find user in Company, Manager, or PurchaseOfficer collections
    let user = null;
    let roleType = null;

    // Check Company
    user = await Company.findOne({ email: lowercaseEmail });
    if (user) {
      roleType = "COMPANY";
    }

    // Check Manager
    if (!user) {
      user = await Manager.findOne({ email: lowercaseEmail });
      if (user) {
        roleType = "MANAGER";
      }
    }

    // Check PurchaseOfficer
    if (!user) {
      user = await PurchaseOfficer.findOne({ email: lowercaseEmail });
      if (user) {
        roleType = "PO";
      }
    }

    // 3. Handle user not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 5. Generate JWT Token
    if (!process.env.JWT_SECRET) {
      console.warn("WARNING: JWT_SECRET is not defined in environment variables.");
    }

    const payload = {
      id: user._id,
      email: user.email,
      role: user.role || roleType,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "vendor_bridge_jwt_secret_key_2026", // Fallback for testing, but should be set in .env
      { expiresIn: "1d" }
    );

    // 6. Set token in HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    };

    res.cookie("token", token, cookieOptions);

    // 7. Return user info (excluding password)
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        ...userResponse,
        role: userResponse.role || roleType,
      },
    });

  } catch (error) {
    console.error("Login controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};
