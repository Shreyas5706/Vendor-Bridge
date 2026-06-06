import mongoose from "mongoose";

const purchaseOfficerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    contactNo: {
      type: String,
      required: true,
    },
    role:{
        type:String,
        enum:["PO","COMPANY","MANAGER","VENDOR","ADMIN"]
    }
  },
  {
    timestamps: true,
  }
);

const PurchaseOfficer =
  mongoose.models.PurchaseOfficer ||
  mongoose.model("PurchaseOfficer", purchaseOfficerSchema);

export default PurchaseOfficer;