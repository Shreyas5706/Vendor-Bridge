import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Company from "../models/company.model.js";
import PurchaseOfficer from "../models/po.model.js";
import Vendor from "../models/vendor.model.js";
import RFQ from "../models/rfq.model.js";
import Quotation from "../models/quotation.model.js";
import PurchaseOrder from "../models/purchase-order.model.js";
import Invoice from "../models/invoice.model.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  try {
    const company = await Company.findOne();
    const po = await PurchaseOfficer.findOne({ companyId: company?._id });

    if (!company || !po) {
      console.log("Missing prerequisites (Company, PO). Create users through UI first.");
      process.exit(1);
    }

    console.log(`Seeding for Company: ${company.name}`);

    // Create Indian Vendors
    const vendorData = [
      { name: "Tata Steel Procurement", email: "tata@vendor.com", description: "Industrial materials and hardware." },
      { name: "Infosys IT Supplies", email: "infosys@vendor.com", description: "Laptops, servers, and enterprise software." },
      { name: "Reliance Retail B2B", email: "reliance@vendor.com", description: "General office supplies and furniture." },
      { name: "Wipro Enterprise Solutions", email: "wipro@vendor.com", description: "Networking gear and cybersecurity hardware." },
      { name: "Adani Logistics & Supply", email: "adani@vendor.com", description: "Heavy machinery and warehousing equipment." },
    ];

    const passwordHash = await bcrypt.hash("password123", 10);
    const createdVendors = [];

    for (const v of vendorData) {
      let vendor = await Vendor.findOne({ email: v.email });
      if (!vendor) {
        vendor = await Vendor.create({
          name: v.name,
          email: v.email,
          password: passwordHash,
          contactNo: "9876543210",
          country: "India",
          description: v.description,
          status: "ACTIVE"
        });
      }
      createdVendors.push(vendor);
    }

    // Print out 1 account to use
    console.log("\n=====================================");
    console.log("USE THIS VENDOR ACCOUNT TO TEST:");
    console.log(`Email: ${createdVendors[0].email}`);
    console.log(`Password: password123`);
    console.log("=====================================\n");

    // Generate 10 RFQs spread over different times
    const rfqTitles = [
      "Bulk Purchase of Office Laptops", "Data Center Servers Upgrade", "Ergonomic Chairs for New Office",
      "Warehouse Forklifts", "Network Switches and Routers", "Steel Pipes for Construction Project",
      "Enterprise Antivirus Licenses", "Office Desks and Partitions", "Heavy Duty Printers", "Air Conditioning Units"
    ];

    for (let i = 0; i < 10; i++) {
      // Spread dates over the last 4 months
      const randomMonthOffset = Math.floor(Math.random() * 4); // 0 to 3 months ago
      const createdAt = new Date();
      createdAt.setMonth(createdAt.getMonth() - randomMonthOffset);
      
      const deadline = new Date(createdAt);
      deadline.setDate(deadline.getDate() + 14);

      const status = deadline < new Date() ? "CLOSED" : "ACTIVE";

      const rfq = await RFQ.create({
        companyId: company._id,
        createdBy: po._id,
        title: rfqTitles[i],
        description: `Procurement request for ${rfqTitles[i]}`,
        items: [
          { productName: `Item ${i}A`, quantity: 10 + i * 5, unit: "pcs" },
          { productName: `Item ${i}B`, quantity: 20 + i * 2, unit: "pcs" }
        ],
        deadline,
        assignedVendors: createdVendors.map(v => v._id),
        status,
        createdAt
      });

      // Add Quotations
      const q1 = await Quotation.create({
        rfqId: rfq._id,
        vendorId: createdVendors[i % 5]._id,
        items: [
          { productName: `Item ${i}A`, quantity: 10 + i * 5, unit: "pcs", quotedPricePerUnit: 1000 + i * 100, totalItemPrice: (10 + i * 5) * (1000 + i * 100) },
          { productName: `Item ${i}B`, quantity: 20 + i * 2, unit: "pcs", quotedPricePerUnit: 500 + i * 50, totalItemPrice: (20 + i * 2) * (500 + i * 50) }
        ],
        totalAmount: ((10 + i * 5) * (1000 + i * 100)) + ((20 + i * 2) * (500 + i * 50)),
        deliveryNotes: "Can deliver fast",
        status: status === "CLOSED" ? "ACCEPTED" : "PENDING",
        createdAt: new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000)
      });

      const q2 = await Quotation.create({
        rfqId: rfq._id,
        vendorId: createdVendors[(i + 1) % 5]._id,
        items: [
          { productName: `Item ${i}A`, quantity: 10 + i * 5, unit: "pcs", quotedPricePerUnit: 1200 + i * 100, totalItemPrice: (10 + i * 5) * (1200 + i * 100) },
          { productName: `Item ${i}B`, quantity: 20 + i * 2, unit: "pcs", quotedPricePerUnit: 600 + i * 50, totalItemPrice: (20 + i * 2) * (600 + i * 50) }
        ],
        totalAmount: ((10 + i * 5) * (1200 + i * 100)) + ((20 + i * 2) * (600 + i * 50)),
        deliveryNotes: "Standard delivery",
        status: status === "CLOSED" ? "REJECTED" : "PENDING",
        createdAt: new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000)
      });

      // If closed/awarded, generate PO and Invoice
      if (status === "CLOSED") {
        rfq.status = "AWARDED";
        await rfq.save();

        const taxAmount = q1.totalAmount * 0.18;
        const poDate = new Date(q1.createdAt.getTime() + 1 * 24 * 60 * 60 * 1000);
        
        const poRec = await PurchaseOrder.create({
          poNumber: `PO-2026-${10000 + i}`,
          rfqId: rfq._id,
          quotationId: q1._id,
          vendorId: q1.vendorId,
          companyId: company._id,
          items: q1.items.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.quotedPricePerUnit,
            total: item.totalItemPrice
          })),
          subTotal: q1.totalAmount,
          taxPercent: 18,
          taxAmount: taxAmount,
          grandTotal: q1.totalAmount + taxAmount,
          status: "ISSUED",
          issuedBy: po._id,
          createdAt: poDate
        });

        await Invoice.create({
          invoiceNumber: `INV-2026-${10000 + i}`,
          poId: poRec._id,
          rfqId: rfq._id,
          vendorId: q1.vendorId,
          companyId: company._id,
          amount: poRec.grandTotal,
          status: Math.random() > 0.3 ? "PAID" : "UNPAID",
          dueDate: new Date(poDate.getTime() + 15 * 24 * 60 * 60 * 1000),
          createdAt: new Date(poDate.getTime() + 2 * 24 * 60 * 60 * 1000)
        });
      }
    }

    console.log("Mock data seeded successfully!");
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
