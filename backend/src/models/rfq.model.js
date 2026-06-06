import mongoose from "mongoose";

const rfqSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    items: [
      {
        productName: {
          type: String,
          required: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unit: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    deadline: {
      type: Date,
      required: true,
    },
    assignedVendors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
        required: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOfficer",
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "CLOSED", "PO_GENERATED", "DRAFT", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

// Static method to automatically transition RFQs past their deadline to INACTIVE
rfqSchema.statics.updateExpiredStatus = async function () {
  return await this.updateMany(
    { deadline: { $lt: new Date() }, status: "ACTIVE" },
    { $set: { status: "INACTIVE" } }
  );
};

const RFQ = mongoose.models.RFQ || mongoose.model("RFQ", rfqSchema);
export default RFQ;
