import PurchaseOrder from "../../models/purchase-order.model.js";
import Invoice from "../../models/invoice.model.js";
import Quotation from "../../models/quotation.model.js";
import RFQ from "../../models/rfq.model.js";

// Utility to generate random unique numbers
const generateId = (prefix) => {
  return `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

export const generatePO = async (req, res) => {
  try {
    const { quotationId } = req.body;
    const userId = req.user.id;

    // Fetch the approved quotation
    const quotation = await Quotation.findById(quotationId).populate("rfqId");
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }

    if (quotation.status !== "ACCEPTED") {
      return res.status(400).json({ success: false, message: "Quotation must be ACCEPTED to generate a PO" });
    }

    // Check if PO already exists
    const existingPO = await PurchaseOrder.findOne({ quotationId });
    if (existingPO) {
      return res.status(400).json({ success: false, message: "Purchase Order already generated for this quotation" });
    }

    const rfq = await RFQ.findById(quotation.rfqId);
    
    // Calculate subtotal, tax and grand total
    const subTotal = quotation.totalAmount;
    const taxPercent = 18; // Defaulting to 18% GST as per plan
    const taxAmount = (subTotal * taxPercent) / 100;
    const grandTotal = subTotal + taxAmount;

    // Create the items array mapping from quotation/RFQ
    // Quotation items only have quotedPricePerUnit and productName. We need quantity from RFQ.
    const poItems = quotation.items.map(qItem => {
      // Find matching item in RFQ
      const rfqItem = rfq.items.find(i => i.productName === qItem.productName);
      const qty = rfqItem ? rfqItem.quantity : 1;
      const unit = rfqItem ? rfqItem.unit : "pcs";
      return {
        productName: qItem.productName,
        quantity: qty,
        unit: unit,
        unitPrice: qItem.quotedPricePerUnit,
        total: qItem.quotedPricePerUnit * qty
      };
    });

    const newPO = new PurchaseOrder({
      poNumber: generateId("PO"),
      rfqId: quotation.rfqId,
      quotationId: quotation._id,
      vendorId: quotation.vendorId,
      companyId: rfq.companyId,
      items: poItems,
      subTotal,
      taxPercent,
      taxAmount,
      grandTotal,
      deliveryNotes: quotation.deliveryNotes,
      issuedBy: userId
    });

    await newPO.save();

    return res.status(201).json({
      success: true,
      message: "Purchase Order generated successfully",
      data: newPO
    });

  } catch (error) {
    console.error("Generate PO error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const generateInvoice = async (req, res) => {
  try {
    const { poId } = req.body;
    
    const po = await PurchaseOrder.findById(poId);
    if (!po) {
      return res.status(404).json({ success: false, message: "Purchase Order not found" });
    }

    const existingInvoice = await Invoice.findOne({ poId });
    if (existingInvoice) {
      return res.status(400).json({ success: false, message: "Invoice already generated for this PO" });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days default payment terms

    const newInvoice = new Invoice({
      invoiceNumber: generateId("INV"),
      poId: po._id,
      rfqId: po.rfqId,
      vendorId: po.vendorId,
      companyId: po.companyId,
      amount: po.grandTotal,
      dueDate
    });

    await newInvoice.save();

    return res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      data: newInvoice
    });

  } catch (error) {
    console.error("Generate Invoice error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
