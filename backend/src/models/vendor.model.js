import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    contactNo: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },
    description:{
        type: String,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    role:{
        type:String,
        enum:["PO","COMPANY","MANAGER","VENDOR","ADMIN"]
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Vendor =
  mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);

export default Vendor;