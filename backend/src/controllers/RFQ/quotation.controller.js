import mongoose from "mongoose";
import RFQ from "../../models/rfq.model.js";
import Vendor from "../../models/vendor.model.js";
import Quotation from "../../models/quotation.model.js";
import Manager from "../../models/manager.model.js";
import Company from "../../models/company.model.js";

export const submitQuotation = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { rfqId, items, deliveryNotes } = req.body;

    // 1. Authorize: Check if logged-in user is a Vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(403).json({ success: false, message: "Only vendors can submit quotations." });
    }

    // 2. Validation
    if (!rfqId || !items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "rfqId and items array are required." });
    }

    // Find the RFQ
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ success: false, message: "RFQ not found." });
    }

    // Verify vendor is assigned to this RFQ
    if (!rfq.assignedVendors.includes(vendorId)) {
      return res.status(403).json({ success: false, message: "You are not assigned to this RFQ." });
    }

    // Verify RFQ is active
    if (rfq.status !== "ACTIVE" && rfq.status !== "OPEN") {
      return res.status(400).json({ success: false, message: "This RFQ is no longer accepting quotations." });
    }

    // Check if vendor already submitted a quotation
    const existingQuotation = await Quotation.findOne({ rfqId, vendorId });
    if (existingQuotation) {
      return res.status(400).json({ success: false, message: "You have already submitted a quotation for this RFQ." });
    }

    // 3. Process items and calculate total
    let totalAmount = 0;
    const processedItems = [];

    for (const rfqItem of rfq.items) {
      const quotedItem = items.find(i => i.productName === rfqItem.productName);
      if (!quotedItem || typeof quotedItem.quotedPricePerUnit !== 'number' || quotedItem.quotedPricePerUnit < 0) {
        return res.status(400).json({ success: false, message: `Invalid or missing price for item: ${rfqItem.productName}` });
      }

      const totalItemPrice = rfqItem.quantity * quotedItem.quotedPricePerUnit;
      totalAmount += totalItemPrice;

      processedItems.push({
        productName: rfqItem.productName,
        quantity: rfqItem.quantity,
        unit: rfqItem.unit,
        quotedPricePerUnit: quotedItem.quotedPricePerUnit,
        totalItemPrice
      });
    }

    // 4. Create Quotation
    const newQuotation = new Quotation({
      rfqId,
      vendorId,
      items: processedItems,
      totalAmount,
      deliveryNotes,
      status: "PENDING"
    });

    await newQuotation.save();

    // 5. Add to RFQ
    rfq.quotations.push(newQuotation._id);
    await rfq.save();

    return res.status(201).json({
      success: true,
      message: "Quotation submitted successfully",
      data: newQuotation
    });

  } catch (error) {
    console.error("Submit quotation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during quotation submission",
      error: error.message
    });
  }
};

export const approveQuotation = async (req, res) => {
  try {
    const { id } = req.params; // Quotation ID
    const userId = req.user.id;

    // 1. Authorize: Only Managers (or Company admins) can approve
    const manager = await Manager.findById(userId);
    const company = await Company.findById(userId);
    
    if (!manager && !company) {
      return res.status(403).json({ success: false, message: "Access denied. Only Managers or Company admins can approve quotations." });
    }

    // 2. Fetch the quotation
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    // Ensure it is pending
    if (quotation.status !== "PENDING") {
      return res.status(400).json({ success: false, message: `Quotation is already ${quotation.status}.` });
    }

    // 3. Mark the chosen quotation as ACCEPTED
    quotation.status = "ACCEPTED";
    await quotation.save();

    // 4. Mark all other quotations for the same RFQ as REJECTED
    await Quotation.updateMany(
      { rfqId: quotation.rfqId, _id: { $ne: quotation._id } },
      { $set: { status: "REJECTED" } }
    );

    // 5. Update the parent RFQ status to AWARDED
    await RFQ.findByIdAndUpdate(quotation.rfqId, { status: "AWARDED" });

    return res.status(200).json({
      success: true,
      message: "Quotation approved successfully! Alternative quotations have been rejected.",
      data: quotation
    });

  } catch (error) {
    console.error("Approve quotation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during quotation approval",
      error: error.message
    });
  }
};
