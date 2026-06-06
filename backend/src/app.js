import cookieParser from "cookie-parser";
import express from "express"
import cors from "cors"
import morgan from "morgan";

export const app = express();
app.use(express.json())
app.use(cookieParser())
app.use(morgan("dev"))


app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );