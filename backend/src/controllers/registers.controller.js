import bcrypt from "bcrypt";
import mongoose from "mongoose";
import Company from "../models/company.model.js";
import Manager from "../models/manager.model.js";
import PurchaseOfficer from "../models/po.model.js";
import Vendor from "../models/vendor.model.js";

/**
 * Controller to handle role-based registration
 * Destructures body, extracts role, validates, hashes passwords, and saves records 
 * according to the respective schema requirements.
 */
export const register = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required for registration",
      });
    }

    const normalizedRole = role.toUpperCase().trim();

    // Validate that the role is supported
    const allowedRoles = ["COMPANY", "MANAGER", "PO", "VENDOR"];
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role: ${role}. Allowed roles are: ${allowedRoles.join(", ")}`,
      });
    }

    // Helper to check if email already exists in any collection
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
      const { name, email, password, contactNo, country, description } = req.body;

      if (!name || !email || !password || !contactNo || !country) {
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
        email,
        password: hashedPassword,
        contactNo,
        country,
        description,
        role: "COMPANY",
      });

      await newCompany.save();

      const responseData = newCompany.toObject();
      delete responseData.password;

      return res.status(201).json({
        success: true,
        message: "Company registered successfully",
        data: responseData,
      });
    }

    // ----------------------------------------------------
    // MANAGER REGISTRATION
    // ----------------------------------------------------
    if (normalizedRole === "MANAGER") {
      const { companyId, name, email, password, contactNo } = req.body;

      if (!companyId || !name || !email || !password || !contactNo) {
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

      // Verify Company exists
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
        email,
        password: hashedPassword,
        contactNo,
        role: "MANAGER",
      });

      await newManager.save();

      // Update Company reference
      targetCompany.manager = newManager._id;
      await targetCompany.save();

      const responseData = newManager.toObject();
      delete responseData.password;

      return res.status(201).json({
        success: true,
        message: "Manager registered successfully and linked to Company",
        data: responseData,
      });
    }

    // ----------------------------------------------------
    // PURCHASE OFFICER (PO) REGISTRATION
    // ----------------------------------------------------
    if (normalizedRole === "PO") {
      const { companyId, name, email, password, contactNo } = req.body;

      if (!companyId || !name || !email || !password || !contactNo) {
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

      // Verify Company exists
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
        email,
        password: hashedPassword,
        contactNo,
        role: "PO",
      });

      await newPO.save();

      // Push PO reference to Company array
      targetCompany.PO.push(newPO._id);
      await targetCompany.save();

      const responseData = newPO.toObject();
      delete responseData.password;

      return res.status(201).json({
        success: true,
        message: "Purchase Officer registered successfully and linked to Company",
        data: responseData,
      });
    }

    // ----------------------------------------------------
    // VENDOR REGISTRATION
    // ----------------------------------------------------
    if (normalizedRole === "VENDOR") {
      const { name, email, contactNo, country, description } = req.body;

      if (!name || !email || !contactNo || !country) {
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
        email,
        contactNo,
        country,
        description,
        status: "ACTIVE",
        role: "VENDOR",
      });

      await newVendor.save();

      return res.status(201).json({
        success: true,
        message: "Vendor registered successfully",
        data: newVendor,
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
