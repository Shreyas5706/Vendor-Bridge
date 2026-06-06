import Vendor from "../../models/vendor.model.js";

export const searchVendors = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.length < 2) {
      return res.status(200).json({ success: true, vendors: [] });
    }

    const regex = new RegExp(query, "i");
    const vendors = await Vendor.find({
      $or: [{ name: regex }, { email: regex }],
      status: "ACTIVE"
    }).select("name email contactNo status");

    return res.status(200).json({ success: true, vendors });
  } catch (error) {
    console.error("Search vendors error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error searching vendors",
      error: error.message,
    });
  }
};
