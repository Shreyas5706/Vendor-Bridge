import { configDotenv } from "dotenv";

configDotenv();

import { app } from "./src/app.js";
import { connectToDB } from "./src/config/db.js";
import "./src/config/redis.js";

app.get("/",(req,res)=>{
  res.send("Server is Running")
})

const startServer = async () => {
  try {
    await connectToDB();

    app.listen(process.env.PORT, () => {
      console.log(`Server is Running on ${process.env.PORT} 🚀`);
    });
  } catch (err) {
    console.log("Server Startup Error:", err);
    process.exit(1);
  }
};

startServer();