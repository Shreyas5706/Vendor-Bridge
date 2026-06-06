import mongoose from "mongoose";

export const connectToDB = () => {
  mongoose
    .connect(process.env.DB_URL)
    .then(() => {
      console.log("Database Connected Successfully ✅");
    })
    .catch((error) => {
      console.log("Error in DB:", error);
    });
};