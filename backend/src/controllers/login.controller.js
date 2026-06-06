import bcrypt from "bcrypt";
import Company from "../models/company.model.js";
import Manager from "../models/manager.model.js";
import PurchaseOfficer from "../models/po.model.js";
import Vendor from "../models/vendor.model.js";
import { generateToken } from "../utils/generateToken.js";

/**
 * Basic login controller
 * Takes email and password, checks in Company, Manager, PurchaseOfficer, and Vendor collections.
 * Uses generateToken utility to sign the JWT.
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

    // 2. Find user in Company, Manager, PurchaseOfficer, or Vendor collections
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

    // Check Vendor
    if (!user) {
      user = await Vendor.findOne({ email: lowercaseEmail });
      if (user) {
        roleType = "VENDOR";
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
    if (roleType === "VENDOR") {
      // Since Vendor schema has no password field, we verify the user exists and is active.
      if (user.status === "INACTIVE") {
        return res.status(403).json({
          success: false,
          message: "Your Vendor account is INACTIVE. Please contact administration.",
        });
      }
    } else {
      // For Company, Manager, and PO, verify password with bcrypt
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
    }

    // 5. Generate JWT Token using utility
    const token = generateToken(user);

    // 6. Set token in HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches the token expiry of 7d)
    };

    res.cookie("token", token, cookieOptions);

    // 7. Return user info (excluding password if it exists)
    const userResponse = user.toObject();
    if (userResponse.password) {
      delete userResponse.password;
    }

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
