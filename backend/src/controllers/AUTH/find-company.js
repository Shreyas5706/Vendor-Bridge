import Company from "../../models/company.model.js";

/**
 * GET /api/auth/find-company?email=company@example.com
 *
 * Used by MANAGER / PO registrants to find the company they belong to.
 * Returns only safe public fields: _id, name, email.
 */
export const findCompany = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Company email is required as a query parameter",
      });
    }

    const company = await Company.findOne({
      email: email.toLowerCase().trim(),
    }).select("_id name email");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "No company found with this email address",
      });
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
