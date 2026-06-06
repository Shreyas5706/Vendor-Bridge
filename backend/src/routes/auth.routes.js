import { Router } from "express";
const authRouter = Router();

import { sendOTP } from "../controllers/AUTH/send-otp.js";
import { verifyOTP } from "../controllers/AUTH/verifyOTP.js";
import { register } from "../controllers/AUTH/registers.controller.js";
import { login } from "../controllers/AUTH/login.controller.js";

// Step 1 — request an OTP to be sent to the given email
authRouter.post("/send-otp", sendOTP);

// Step 2 (optional standalone) — verify OTP only
authRouter.post("/verify-otp", verifyOTP);

// Step 2+3 combined — send { email, otp, role, ...fields } to register
// OTP is verified internally before user creation
authRouter.post("/register", register);

// Login
authRouter.post("/login", login);

export default authRouter;