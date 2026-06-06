import Company from "../../models/company.model.js";
import RFQ from "../../models/rfq.model.js";
import Vendor from "../../models/vendor.model.js";
import Manager from "../../models/manager.model.js";
import PurchaseOfficer from "../../models/po.model.js";
import Quotation from "../../models/quotation.model.js";
import PurchaseOrder from "../../models/purchase-order.model.js";
import Invoice from "../../models/invoice.model.js";

/**
 * Get company dashboard data (manager, PO list, RFQs, and all Vendors)
 */
export const getCompanyDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    let companyIdToUse = userId;

    // Check if user is a Manager or PO
    const manager = await Manager.findById(userId);
    if (manager) {
      companyIdToUse = manager.companyId;
    } else {
      const po = await PurchaseOfficer.findById(userId);
      if (po) {
        companyIdToUse = po.companyId;
      }
    }

    // 1. Find the company and populate manager and PO list
    const company = await Company.findById(companyIdToUse)
      .populate("manager", "name email contactNo role")
      .populate("PO", "name email contactNo role");

    if (!company) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Companies, Managers, and POs can view this dashboard.",
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

    // 5. Find quotations for these RFQs
    const rfqIds = rfqs.map(r => r._id);
    const quotations = await Quotation.find({ rfqId: { $in: rfqIds } })
      .populate("vendorId", "name email contactNo")
      .populate("rfqId", "title")
      .sort({ createdAt: -1 });

    // 6. Find Purchase Orders
    const pos = await PurchaseOrder.find({ companyId: companyIdToUse })
      .populate("vendorId", "name email contactNo")
      .populate("rfqId", "title")
      .sort({ createdAt: -1 });

    // 7. Find Invoices
    const invoices = await Invoice.find({ companyId: companyIdToUse })
      .populate("vendorId", "name email contactNo")
      .sort({ createdAt: -1 });

    const companyResponse = company.toObject();
    if (companyResponse.password) delete companyResponse.password;

    return res.status(200).json({
      success: true,
      company: companyResponse,
      rfqs: rfqs,
      vendors: vendors,
      quotations: quotations,
      pos: pos,
      invoices: invoices
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
