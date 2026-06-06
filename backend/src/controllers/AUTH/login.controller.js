import bcrypt from "bcrypt";
import Company from "../../models/company.model.js";          // fixed path
import Manager from "../../models/manager.model.js";          // fixed path
import PurchaseOfficer from "../../models/po.model.js";       // fixed path
import Vendor from "../../models/vendor.model.js";            // fixed path
import { generateToken } from "../../utils/generateToken.js"; // fixed path

/**
 * Login controller.
 * Searches across Company, Manager, PurchaseOfficer, and Vendor collections.
 * Vendors have no password — their account is validated by active status only.
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

    // 2. Find user across all collections
    let user = null;
    let roleType = null;

    user = await Company.findOne({ email: lowercaseEmail });
    if (user) roleType = "COMPANY";

    if (!user) {
      user = await Manager.findOne({ email: lowercaseEmail });
      if (user) roleType = "MANAGER";
    }

    if (!user) {
      user = await PurchaseOfficer.findOne({ email: lowercaseEmail });
      if (user) roleType = "PO";
    }

    if (!user) {
      user = await Vendor.findOne({ email: lowercaseEmail });
      if (user) roleType = "VENDOR";
    }

    // 3. User not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Password / status check
    if (roleType === "VENDOR") {
      // Vendors have no password — check account status instead
      if (user.status === "INACTIVE") {
        return res.status(403).json({
          success: false,
          message: "Your Vendor account is INACTIVE. Please contact administration.",
        });
      }
    } else {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
    }

    // 5. Generate JWT
    const token = generateToken(user);

    // 6. Set token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 7. Return sanitised user object
    const userResponse = user.toObject();
    if (userResponse.password) delete userResponse.password;

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
