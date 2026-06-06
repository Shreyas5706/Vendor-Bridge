import Company from "../../models/company.model.js";
import Manager from "../../models/manager.model.js";
import PurchaseOfficer from "../../models/po.model.js";
import Vendor from "../../models/vendor.model.js";

/**
 * Controller to verify the active session.
 * Reconstructs the Redux state on frontend load by fetching the full user profile.
 */
export const checkAuth = async (req, res) => {
  try {
    const userId = req.user.id;

    let user = null;
    let roleType = null;

    user = await Company.findById(userId);
    if (user) roleType = "COMPANY";

    if (!user) {
      user = await Manager.findById(userId);
      if (user) roleType = "MANAGER";
    }

    if (!user) {
      user = await PurchaseOfficer.findById(userId);
      if (user) roleType = "PO";
    }

    if (!user) {
      user = await Vendor.findById(userId);
      if (user) roleType = "VENDOR";
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Authenticated user record not found in database",
      });
    }

    const userResponse = user.toObject();
    if (userResponse.password) delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Session is valid",
      user: {
        ...userResponse,
        role: userResponse.role || roleType,
      },
    });
  } catch (error) {
    console.error("Check Auth Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during session validation",
      error: error.message,
    });
  }
};
