import { app } from "./src/app.js";
import { connectToDB } from "./src/config/db.js";
import { configDotenv } from "dotenv";

configDotenv()
connectToDB()

app.listen(process.env.PORT,()=>{
    try{
        console.log(`Serever is Running on ${process.env.PORT}`)
    }
    catch(err){
        console.log("Error in Server : ",err)
    }
})