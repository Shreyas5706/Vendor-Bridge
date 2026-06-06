import mongoose from "mongoose";
import RFQ from "../models/rfq.model.js";
import PurchaseOfficer from "../models/po.model.js";
import Vendor from "../models/vendor.model.js";
import Manager from "../models/manager.model.js";

/**
 * Create a new Request for Quotation (RFQ)
 * Only accessible by Purchase Officers (PO).
 */
export const createRFQ = async (req, res) => {
  try {
    // 1. Authorize: Check if the logged-in user is a Purchase Officer (PO)
    // The authUser middleware sets req.user = { id, email }
    const po = await PurchaseOfficer.findById(req.user.id);
    if (!po) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Purchase Officers can create RFQs.",
      });
    }

    // Automatically trigger update for any expired RFQs first
    await RFQ.updateExpiredStatus();

    const { title, description, items, deadline, assignedVendors } = req.body;

    // 2. Validation: Required fields
    if (!title || !items || !deadline || !assignedVendors) {
      return res.status(400).json({
        success: false,
        message: "Title, items, deadline, and assignedVendors are required fields.",
      });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items must be a non-empty array.",
      });
    }

    for (const item of items) {
      if (!item.productName || !item.quantity || !item.unit) {
        return res.status(400).json({
          success: false,
          message: "Each item must have a productName, quantity, and unit.",
        });
      }
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Item quantity must be a positive number.",
        });
      }
    }

    // Validate deadline
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid deadline date format.",
      });
    }

    if (deadlineDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Deadline must be a future date.",
      });
    }

    // Validate assignedVendors
    if (!Array.isArray(assignedVendors) || assignedVendors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "assignedVendors must be a non-empty array of vendor IDs.",
      });
    }

    // Verify each vendor ID is valid and exists in the Vendor collection
    const validVendorIds = [];
    for (const vendorId of assignedVendors) {
      if (!mongoose.Types.ObjectId.isValid(vendorId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid vendor ID format: ${vendorId}`,
        });
      }

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: `Vendor with ID ${vendorId} not found.`,
        });
      }

      if (vendor.status === "INACTIVE") {
        return res.status(400).json({
          success: false,
          message: `Vendor ${vendor.name} (${vendorId}) is currently INACTIVE and cannot be assigned to an RFQ.`,
        });
      }

      validVendorIds.push(vendor._id);
    }

    // 3. Create RFQ
    const newRFQ = new RFQ({
      title,
      description,
      items,
      deadline: deadlineDate,
      assignedVendors: validVendorIds,
      createdBy: po._id,
      status: "ACTIVE",
    });

    await newRFQ.save();

    return res.status(201).json({
      success: true,
      message: "RFQ created successfully",
      data: newRFQ,
    });

  } catch (error) {
    console.error("Create RFQ controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during RFQ creation",
      error: error.message,
    });
  }
};

/**
 * Get all RFQs
 * Automatically checks and transitions expired RFQs to INACTIVE.
 * - Vendors see only RFQs assigned to them.
 * - POs, Managers, and Companies see all.
 */
export const getRFQs = async (req, res) => {
  try {
    // 1. Automatically update status of any expired RFQs
    await RFQ.updateExpiredStatus();

    const userId = req.user.id;
    let query = {};

    // 2. Determine role and filter query
    const vendor = await Vendor.findById(userId);
    if (vendor) {
      // Vendors only see RFQs they are assigned to (excluding DRAFTs)
      query = { assignedVendors: vendor._id, status: { $ne: "DRAFT" } };
    } else {
      // Verify the requester has a valid role (PO, Manager, or Company)
      const [po, manager, company] = await Promise.all([
        PurchaseOfficer.findById(userId),
        Manager.findById(userId),
        Company.findById(userId),
      ]);

      if (!po && !manager && !company) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Unauthorized role.",
        });
      }
      // Authorized staff can view all RFQs
      query = {};
    }

    const rfqs = await RFQ.find(query)
      .populate("assignedVendors", "name email contactNo status")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: rfqs.length,
      data: rfqs,
    });

  } catch (error) {
    console.error("Get RFQs error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during retrieving RFQs",
      error: error.message,
    });
  }
};

/**
 * Get a specific RFQ by ID
 * Automatically checks and transitions the RFQ to INACTIVE if expired.
 */
export const getRFQById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid RFQ ID format",
      });
    }

    // 1. Automatically update status of any expired RFQs
    await RFQ.updateExpiredStatus();

    const rfq = await RFQ.findById(id)
      .populate("assignedVendors", "name email contactNo status")
      .populate("createdBy", "name email");

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }

    // 2. Authorization check: Vendors can only view if assigned
    const userId = req.user.id;
    const vendor = await Vendor.findById(userId);
    if (vendor) {
      const isAssigned = rfq.assignedVendors.some(
        (v) => v._id.toString() === vendor._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You are not assigned to this RFQ.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: rfq,
    });

  } catch (error) {
    console.error("Get RFQ by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during retrieving RFQ details",
      error: error.message,
    });
  }
};
