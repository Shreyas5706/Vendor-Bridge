import { Router } from "express";
const authRouter = Router();

import { sendOTP }     from "../controllers/AUTH/send-otp.js";
import { verifyOTP }   from "../controllers/AUTH/verifyOTP.js";
import { register }    from "../controllers/AUTH/registers.controller.js";
import { login }       from "../controllers/AUTH/login.controller.js";
import { findCompany } from "../controllers/AUTH/find-company.js";
import { checkAuth }   from "../controllers/AUTH/check-auth.js";
import { logout }      from "../controllers/AUTH/logout.controller.js";
import { authUser }    from "../middleware/auth.middleware.js";

// Step 1 — send OTP to an email address
authRouter.post("/send-otp", sendOTP);

// Step 2 (optional standalone) — verify OTP only
authRouter.post("/verify-otp", verifyOTP);

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

export default authRouter;