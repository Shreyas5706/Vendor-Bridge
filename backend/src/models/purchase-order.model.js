import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true },
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: "RFQ", required: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation", required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  
  items: [{
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  
  subTotal: { type: Number, required: true },
  taxPercent: { type: Number, default: 18 },
  taxAmount: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  
  status: {
    type: String,
    enum: ["ISSUED", "ACCEPTED_BY_VENDOR", "DELIVERED"],
    default: "ISSUED"
  },
  
  deliveryNotes: { type: String },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Manager" } // Can be Manager, Company, or PO depending on who clicks generate
}, { timestamps: true });

const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", purchaseOrderSchema);

export default PurchaseOrder;
