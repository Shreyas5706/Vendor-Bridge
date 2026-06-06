# 🌉 Vendor Bridge ERP

> **Bridging Companies and Vendors Through Smart Procurement Automation**

Vendor Bridge is a modern **Enterprise Resource Planning (ERP)** platform built to streamline the complete procurement lifecycle. It connects **Company Managers**, **Procurement Officers**, and **External Vendors** through a centralized system that transforms traditional paperwork into an efficient digital workflow.

From creating RFQs to approving quotations, generating Purchase Orders, tracking invoices, and analyzing procurement spending — Vendor Bridge provides everything in one seamless platform.

---

## ✨ Features

### 🔐 Secure Authentication & Authorization

* JWT-based authentication
* Password hashing with bcryptjs
* OTP Email Verification via Resend API
* Role-based access control
* Protected routes and secure workflows

### 👥 Multi-Role Architecture

#### 🏢 Company Manager

* Review vendor quotations
* Approve or reject procurement requests
* Generate Purchase Orders
* Monitor procurement analytics

#### 📋 Procurement Officer

* Create and manage RFQs
* Invite vendors for quotations
* Track procurement status
* Manage purchase workflows

#### 🏭 Vendor

* View assigned RFQs
* Submit competitive quotations
* Track Purchase Orders
* Generate invoices

---

## 📦 Procurement Workflow

```text
RFQ Creation
      ↓
Vendor Quotation Submission
      ↓
Manager Review & Approval
      ↓
Purchase Order Generation
      ↓
Invoice Creation
      ↓
Procurement Analytics
```

---

## 🚀 Core Modules

### 📨 RFQ Management

Create detailed Requests for Quotations with:

* Product specifications
* Quantity requirements
* Deadlines
* Vendor assignments
* Status tracking

### 💰 Quotation Engine

Vendors can:

* Submit pricing proposals
* Add taxes and discounts
* Update quotations before deadline
* Track approval status

### 📄 Automated Purchase Orders

Generate professional Purchase Orders instantly with:

* Automatic GST calculations
* Vendor information
* Order summaries
* Approval tracking
* Indian currency formatting

### 🧾 Smart Invoice System

* Auto-generated invoices
* GST support
* PDF downloads
* Commercial invoice templates
* Invoice tracking

### 📊 Analytics Dashboard

Visualize procurement performance through:

* Active RFQs
* Pending approvals
* Vendor activity
* Spending trends
* Monthly procurement statistics

Built using **Recharts** with responsive and animated visualizations.

---

## 🇮🇳 Indian Market Localization

Vendor Bridge is designed specifically for Indian business workflows:

* ₹ Indian Rupee Support
* GST Tax Calculations
* Indian Number Formatting

  * Thousand
  * Lakh
  * Crore
* Regional Procurement Standards

---

# 🛠️ Tech Stack

## Frontend

| Technology      | Purpose            |
| --------------- | ------------------ |
| React.js (Vite) | User Interface     |
| Tailwind CSS v4 | Styling            |
| React Router    | Routing            |
| Redux Toolkit   | State Management   |
| Recharts        | Analytics & Charts |
| jsPDF           | PDF Generation     |
| html2canvas     | PDF Rendering      |

---

## Backend

| Technology | Purpose            |
| ---------- | ------------------ |
| Node.js    | Runtime            |
| Express.js | REST APIs          |
| MongoDB    | Database           |
| Mongoose   | ODM                |
| JWT        | Authentication     |
| bcryptjs   | Password Security  |
| Resend API | OTP Email Services |

---

# 🏗️ System Architecture

```text
Frontend (React + Redux)
           │
           ▼
Backend (Express.js APIs)
           │
           ▼
MongoDB Database
           │
           ▼
Email Services (Resend API)
```

---

# ⚙️ Installation

## Prerequisites

* Node.js v18+
* MongoDB (Local or Atlas)
* Resend API Key

---

## 1️⃣ Backend Setup

Clone the repository:

```bash
git clone https://github.com/your-username/vendor-bridge.git
```

Navigate to backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=3000

DB_URL=mongodb://localhost:27017/vendorbridge

JWT_SECRET=your_super_secret_jwt_key

RESEND_API_KEY=your_resend_api_key
```

Start the server:

```bash
npm start
```

---

## 2️⃣ Frontend Setup

Open a new terminal:

```bash
cd Frontend
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

---

# 🌱 Database Seeder

Want realistic procurement data instantly?

Vendor Bridge includes a mock data seeder that generates:

✅ Vendors
✅ RFQs
✅ Quotations
✅ Purchase Orders
✅ Invoices
✅ Dashboard Analytics Data

Run:

```bash
node src/scripts/seed.js
```

The script automatically outputs testing credentials for a sample Vendor account.

---

# 📸 Screenshots

> Add screenshots here

### Dashboard

```md
![Dashboard](screenshots/dashboard.png)
```

### RFQ Management

```md
![RFQ](screenshots/rfq.png)
```

### Purchase Orders

```md
![PO](screenshots/po.png)
```

### Analytics

```md
![Analytics](screenshots/analytics.png)
```

---

# 🔒 Security Features

* Password Hashing (bcryptjs)
* JWT Authentication
* OTP Verification
* Role-Based Authorization
* Secure API Middleware
* Protected Routes

---

# 📈 Future Enhancements

* Real-time Notifications
* WebSocket Integration
* Vendor Performance Scoring
* Inventory Management
* Multi-Company Support
* Payment Gateway Integration
* AI-Based Vendor Recommendation

---

# 🤝 Contributing

Contributions are welcome!

```bash
Fork the repository
Create a feature branch
Commit your changes
Push your branch
Create a Pull Request
```

---

# 📄 License

This project is licensed under the MIT License.

---

## ⭐ Support

If you found this project useful, consider giving it a **Star ⭐** on GitHub.

Built with ❤️ using React, Node.js, Express, MongoDB, and Tailwind CSS.
