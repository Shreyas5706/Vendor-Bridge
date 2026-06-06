import cookieParser from "cookie-parser";
import express from "express"
import cors from "cors"
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRouter from "./routes/auth.routes.js";

export const app = express();

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "https://vendor-bridge-iota.vercel.app",
      "http://localhost:5173"
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json())
app.use(cookieParser())
app.use("/api/auth",authRouter)
app.use(morgan("dev"))

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use(limiter);
