import bcrypt from "bcrypt";
import mongoose from "mongoose";
import Company from "../../models/company.model.js";
import Manager from "../../models/manager.model.js";
import PurchaseOfficer from "../../models/po.model.js";
import Vendor from "../../models/vendor.model.js";
import { generateToken } from "../../utils/generateToken.js";
import { checkOTP } from "./verifyOTP.js";

/**
 * Role-based registration controller.
 *
 * Flow for COMPANY / VENDOR:
 *   1. POST /send-otp   { email }            → OTP sent to user's email
 *   2. POST /register   { email, otp, role, ...fields }
 *
 * Flow for MANAGER / PO:
 *   1. GET  /find-company?email=<companyEmail>  → returns { _id, name, email }
 *   2. POST /send-otp   { email: companyEmail } → OTP sent to the COMPANY's email
 *   3. POST /register   { email: <userEmail>, companyEmail, otp, companyId, role, ...fields }
 *      OTP is verified against companyEmail (where it was sent), not the user's own email.
 */
export const register = async (req, res) => {
  try {
    const { role, email, otp, companyEmail } = req.body;

    // --- Required fields on every request ---
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required for registration",
      });
    }

    const normalizedRole = role.toUpperCase().trim();
    const allowedRoles = ["COMPANY", "MANAGER", "PO", "VENDOR"];

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed: ${allowedRoles.join(", ")}`,
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required for registration",
      });
    }

    const isCompanyRole = normalizedRole === "MANAGER" || normalizedRole === "PO";

    // --- Verify OTP only for PO and MANAGER ---
    if (isCompanyRole) {
      if (!otp) {
        return res.status(400).json({
          success: false,
          message: "OTP is required for MANAGER and PO registration",
        });
      }

      if (!companyEmail) {
        return res.status(400).json({
          success: false,
          message: "companyEmail is required for MANAGER and PO registration (OTP was sent there)",
        });
      }

      const otpResult = await checkOTP(companyEmail, otp);
      if (!otpResult.valid) {
        return res.status(400).json({
          success: false,
          message: otpResult.reason,
        });
      }
    }

    // --- Helper: cross-collection duplicate email check ---
    const checkEmailExists = async (emailToCheck) => {
      const lower = emailToCheck.toLowerCase().trim();
      const [c, m, p, v] = await Promise.all([
        Company.findOne({ email: lower }),
        Manager.findOne({ email: lower }),
        PurchaseOfficer.findOne({ email: lower }),
        Vendor.findOne({ email: lower }),
      ]);
      return c || m || p || v;
    };

    // --------------------------------------------------------
    // COMPANY
    // --------------------------------------------------------
    if (normalizedRole === "COMPANY") {
      const { name, password, contactNo, country, description } = req.body;

      if (!name || !password || !contactNo || !country) {
        return res.status(400).json({
          success: false,
          message: "name, email, password, contactNo, and country are required",
        });
      }

      if (await checkEmailExists(email)) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered",
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

    // --------------------------------------------------------
    // MANAGER
    // --------------------------------------------------------
    if (normalizedRole === "MANAGER") {
      const { companyId, name, password, contactNo } = req.body;

      if (!companyId || !name || !password || !contactNo) {
        return res.status(400).json({
          success: false,
          message: "companyId, name, email, password, and contactNo are required",
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
          message: "Email is already registered",
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
        message: "Manager registered and linked to Company",
        token,
        data: responseData,
      });
    }

    // --------------------------------------------------------
    // PURCHASE OFFICER (PO)
    // --------------------------------------------------------
    if (normalizedRole === "PO") {
      const { companyId, name, password, contactNo } = req.body;

      if (!companyId || !name || !password || !contactNo) {
        return res.status(400).json({
          success: false,
          message: "companyId, name, email, password, and contactNo are required",
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
          message: "Email is already registered",
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
        message: "Purchase Officer registered and linked to Company",
        token,
        data: responseData,
      });
    }

    // --------------------------------------------------------
    // VENDOR
    // --------------------------------------------------------
    if (normalizedRole === "VENDOR") {
      const { name, password, contactNo, country, description } = req.body;

      if (!name || !password || !contactNo || !country) {
        return res.status(400).json({
          success: false,
          message: "name, email, password, contactNo, and country are required",
        });
      }

      if (await checkEmailExists(email)) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newVendor = new Vendor({
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        contactNo,
        country,
        description,
        status: "ACTIVE",
        role: "VENDOR",
      });

      await newVendor.save();

      const token = generateToken(newVendor);
      const responseData = newVendor.toObject();
      delete responseData.password;

      return res.status(201).json({
        success: true,
        message: "Vendor registered successfully",
        token,
        data: responseData,
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};
