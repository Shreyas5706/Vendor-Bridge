import cookieParser from "cookie-parser";
import express from "express"
import cors from "cors"
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRouter from "./routes/auth.routes.js";

export const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json())
app.use(cookieParser())
app.use("/api/auth",authRouter)
app.use(morgan("dev"))

console.log(process.env.RESEND_API_KEY)

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use(limiter);
