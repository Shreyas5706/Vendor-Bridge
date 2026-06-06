import bcrypt from "bcrypt";
import mongoose from "mongoose";
import Company from "../../models/company.model.js";       // fixed path
import Manager from "../../models/manager.model.js";       // fixed path
import PurchaseOfficer from "../../models/po.model.js";    // fixed path
import Vendor from "../../models/vendor.model.js";         // fixed path
import { generateToken } from "../../utils/generateToken.js";
import { checkOTP } from "./verifyOTP.js";

/**
 * Role-based registration controller.
 * Flow:
 *   1. Client calls POST /send-otp with { email } → OTP sent to email
 *   2. Client calls POST /register with { email, otp, role, ...roleFields }
 *      → OTP is verified inline; on success user is created and JWT is returned.
 */
export const register = async (req, res) => {
  try {
    const { role, email, otp } = req.body;

    // --- Guard: role, email, and otp are always required ---
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required for registration",
      });
    }

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required for registration",
      });
    }

    // --- Verify OTP before doing anything else ---
    const otpResult = await checkOTP(email, otp);
    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.reason,
      });
    }

    const normalizedRole = role.toUpperCase().trim();

    const allowedRoles = ["COMPANY", "MANAGER", "PO", "VENDOR"];
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role: ${role}. Allowed roles are: ${allowedRoles.join(", ")}`,
      });
    }

    // Helper to check if email already exists across all collections
    const checkEmailExists = async (email) => {
      const emailLower = email.toLowerCase().trim();
      const [companyExists, managerExists, poExists, vendorExists] = await Promise.all([
        Company.findOne({ email: emailLower }),
        Manager.findOne({ email: emailLower }),
        PurchaseOfficer.findOne({ email: emailLower }),
        Vendor.findOne({ email: emailLower }),
      ]);
      return companyExists || managerExists || poExists || vendorExists;
    };

    // ----------------------------------------------------
    // COMPANY REGISTRATION
    // ----------------------------------------------------
    if (normalizedRole === "COMPANY") {
      const { name, password, contactNo, country, description } = req.body;

      if (!name || !password || !contactNo || !country) {
        return res.status(400).json({
          success: false,
          message: "Name, email, password, contactNo, and country are required for Company registration",
        });
      }

      if (await checkEmailExists(email)) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered in the system",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newCompany = new Company({
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        contactNo,
        country,
        description,
        role: "COMPANY",
      });

      await newCompany.save();

      const token = generateToken(newCompany);
      const responseData = newCompany.toObject();
      delete responseData.password;

      return res.status(201).json({
        success: true,
        message: "Company registered successfully",
        token,
        data: responseData,
      });
    }

    // ----------------------------------------------------
    // MANAGER REGISTRATION
    // ----------------------------------------------------
    if (normalizedRole === "MANAGER") {
      const { companyId, name, password, contactNo } = req.body;

      if (!companyId || !name || !password || !contactNo) {
        return res.status(400).json({
          success: false,
          message: "companyId, name, email, password, and contactNo are required for Manager registration",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid companyId format",
        });
      }

      const targetCompany = await Company.findById(companyId);
      if (!targetCompany) {
        return res.status(404).json({
          success: false,
          message: "Company not found with the provided companyId",
        });
      }

      if (await checkEmailExists(email)) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered in the system",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newManager = new Manager({
        companyId,
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        contactNo,
        role: "MANAGER",
      });

      await newManager.save();

      targetCompany.manager = newManager._id;
      await targetCompany.save();

      const token = generateToken(newManager);
      const responseData = newManager.toObject();
      delete responseData.password;

      return res.status(201).json({
        success: true,
        message: "Manager registered successfully and linked to Company",
        token,
        data: responseData,
      });
    }

    // ----------------------------------------------------
    // PURCHASE OFFICER (PO) REGISTRATION
    // ----------------------------------------------------
    if (normalizedRole === "PO") {
      const { companyId, name, password, contactNo } = req.body;

      if (!companyId || !name || !password || !contactNo) {
        return res.status(400).json({
          success: false,
          message: "companyId, name, email, password, and contactNo are required for Purchase Officer registration",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid companyId format",
        });
      }

      const targetCompany = await Company.findById(companyId);
      if (!targetCompany) {
        return res.status(404).json({
          success: false,
          message: "Company not found with the provided companyId",
        });
      }

      if (await checkEmailExists(email)) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered in the system",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newPO = new PurchaseOfficer({
        companyId,
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        contactNo,
        role: "PO",
      });

      await newPO.save();

      targetCompany.PO.push(newPO._id);
      await targetCompany.save();

      const token = generateToken(newPO);
      const responseData = newPO.toObject();
      delete responseData.password;

      return res.status(201).json({
        success: true,
        message: "Purchase Officer registered successfully and linked to Company",
        token,
        data: responseData,
      });
    }

    // ----------------------------------------------------
    // VENDOR REGISTRATION
    // ----------------------------------------------------
    if (normalizedRole === "VENDOR") {
      const { name, contactNo, country, description } = req.body;

      if (!name || !contactNo || !country) {
        return res.status(400).json({
          success: false,
          message: "Name, email, contactNo, and country are required for Vendor registration",
        });
      }

      if (await checkEmailExists(email)) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered in the system",
        });
      }

      const newVendor = new Vendor({
        name,
        email: email.toLowerCase().trim(),
        contactNo,
        country,
        description,
        status: "ACTIVE",
        role: "VENDOR",
      });

      await newVendor.save();

      const token = generateToken(newVendor);

      const responseData = newVendor.toObject();

      return res.status(201).json({
        success: true,
        message: "Vendor registered successfully",
        token,
        data: responseData,
      });
    }

  } catch (error) {
    console.error("Registration controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};
