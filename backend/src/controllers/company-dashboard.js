import Company from "../../models/company.model.js";
import RFQ from "../models/rfq.model.js";
import Vendor from "../../models/vendor.model.js";

/**
 * Get company dashboard data (manager, PO list, and RFQs)
 */
export const getCompanyDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Find the company and populate manager and PO list
    const company = await Company.findById(userId)
      .populate("manager", "name email contactNo role")
      .populate("PO", "name email contactNo role");

    if (!company) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Companies can view this dashboard.",
      });
    }

    // 2. Automatically update expired RFQs status first
    await RFQ.updateExpiredStatus();

    // 3. Find all RFQs created by this company's Purchase Officers
    const poIds = company.PO.map(po => po._id);

    const rfqs = await RFQ.find({ createdBy: { $in: poIds } })
      .populate("createdBy", "name email contactNo")
      .populate("assignedVendors", "name email contactNo status")
      .sort({ createdAt: -1 });

    // 4. Find all vendors to populate the vendor list
    const vendors = await Vendor.find().select("-password");

    const companyResponse = company.toObject();
    if (companyResponse.password) delete companyResponse.password;

    return res.status(200).json({
      success: true,
      company: companyResponse,
      rfqs: rfqs,
      vendors: vendors
    });

  } catch (error) {
    console.error("Company dashboard controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving company dashboard data",
      error: error.message,
    });
  }
};
