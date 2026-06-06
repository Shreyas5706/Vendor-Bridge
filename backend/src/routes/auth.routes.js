import { Router } from "express";
const authRouter = Router()
import { login } from "../controllers/auth.controller";
import { loginValidator } from "../validator/auth.validate"


authRouter.post("/login",loginValidator,login)



export default authRouter