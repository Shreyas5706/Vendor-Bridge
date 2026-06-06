import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  poId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true },
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: "RFQ", required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  
  amount: { type: Number, required: true }, // Should match PO grandTotal
  
  status: {
    type: String,
    enum: ["UNPAID", "PAID", "CANCELLED"],
    default: "UNPAID"
  },
  
  dueDate: { type: Date, required: true },
  paymentNotes: { type: String }
}, { timestamps: true });

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export default Invoice;
