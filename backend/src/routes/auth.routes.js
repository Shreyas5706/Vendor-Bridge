import { Router } from "express";
const authRouter = Router();

import { sendOTP }     from "../controllers/AUTH/send-otp.js";
import { verifyOTP }   from "../controllers/AUTH/verifyOTP.js";
import { register }    from "../controllers/AUTH/registers.controller.js";
import { login }       from "../controllers/AUTH/login.controller.js";
import { findCompany } from "../controllers/AUTH/find-company.js";
import { checkAuth }   from "../controllers/AUTH/check-auth.js";
import { logout }      from "../controllers/AUTH/logout.controller.js";
import { resetPassword } from "../controllers/AUTH/reset-password.js";
import { getCompanyDashboard } from "../controllers/AUTH/company-dashboard.js";
import { createRFQ, getRFQs, getRFQById } from "../controllers/RFQ/rfq.controller.js";
import { authUser }    from "../middleware/auth.middleware.js";

// Step 1 — send OTP to an email address
authRouter.post("/send-otp", sendOTP);

// Step 2 (optional standalone) — verify OTP only
authRouter.post("/verify-otp", verifyOTP);

// Reset Password — verify OTP and change password
authRouter.post("/reset-password", resetPassword);

// Used by MANAGER / PO to look up company by email before registering
authRouter.get("/find-company", findCompany);

// Register — OTP is verified internally before user creation
authRouter.post("/register", register);

// Login
authRouter.post("/login", login);

// Session check
authRouter.get("/check", authUser, checkAuth);

// Logout
authRouter.post("/logout", logout);

// Company Dashboard details
authRouter.get("/company-dashboard", authUser, getCompanyDashboard);

// Vendor Dashboard details
import { getVendorDashboard } from "../controllers/AUTH/vendor-dashboard.js";
authRouter.get("/vendor-dashboard", authUser, getVendorDashboard);

// Vendor Search
import { searchVendors } from "../controllers/AUTH/vendor.controller.js";
authRouter.get("/vendors/search", authUser, searchVendors);

// RFQ routes
authRouter.post("/rfq", authUser, createRFQ);
authRouter.get("/rfq", authUser, getRFQs);
authRouter.get("/rfq/:id", authUser, getRFQById);

// Quotation routes
import { submitQuotation, approveQuotation } from "../controllers/RFQ/quotation.controller.js";
authRouter.post("/quotation", authUser, submitQuotation);
authRouter.post("/quotation/:id/approve", authUser, approveQuotation);

export default authRouter;