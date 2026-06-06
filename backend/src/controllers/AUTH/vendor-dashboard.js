import Vendor from "../../models/vendor.model.js";
import RFQ from "../../models/rfq.model.js";
import Quotation from "../../models/quotation.model.js";

export const getVendorDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Find the vendor
    const vendor = await Vendor.findById(userId);

    if (!vendor) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Vendors can view this dashboard.",
      });
    }

    // 2. Automatically update expired RFQs status first
    await RFQ.updateExpiredStatus();

    // 3. Find all RFQs assigned to this vendor (excluding DRAFT)
    const rfqs = await RFQ.find({
      assignedVendors: vendor._id,
      status: { $ne: "DRAFT" }
    })
      .populate("createdBy", "name email contactNo")
      .sort({ createdAt: -1 });

    // 4. Find quotations submitted by this vendor
    const quotations = await Quotation.find({ vendorId: vendor._id }).sort({ createdAt: -1 });

    const vendorResponse = vendor.toObject();
    if (vendorResponse.password) delete vendorResponse.password;

    return res.status(200).json({
      success: true,
      vendor: vendorResponse,
      rfqs: rfqs,
      quotations: quotations
    });

  } catch (error) {
    console.error("Vendor dashboard controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving vendor dashboard data",
      error: error.message,
    });
  }
};
