import mongoose from "mongoose";

const rfqSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOfficer",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    items: [
      {
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unit: {
          type: String,
          required: true,
        },
      }
    ],

    deadline: {
      type: Date,
      required: true,
    },

    assignedVendors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
      },
    ],

    quotations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quotation",
      },
    ],

    status: {
      type: String,
      enum: [
        "DRAFT",
        "OPEN",
        "ACTIVE",
        "INACTIVE",
        "CLOSED",
        "AWARDED",
        "CANCELLED",
      ],
      default: "DRAFT",
    },
  },
  {
    timestamps: true,
  }
);

rfqSchema.statics.updateExpiredStatus = async function () {
  const currentDate = new Date();
  await this.updateMany(
    { deadline: { $lt: currentDate }, status: { $in: ["OPEN", "ACTIVE"] } },
    { $set: { status: "INACTIVE" } }
  );
};

const RFQ =
  mongoose.models.RFQ || mongoose.model("RFQ", rfqSchema);

export default RFQ;