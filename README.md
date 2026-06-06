🌉 Vendor Bridge ERP
Vendor Bridge is a full-stack Enterprise Resource Planning (ERP) platform designed to streamline the procurement lifecycle. It bridges the gap between Corporate Procurement Officers, Company Managers, and External Vendors by digitizing RFQs, Quotations, Purchase Orders, and Invoicing into a single, seamless, and beautifully animated dashboard.

✨ Key Features
Role-Based Workflows: Distinct, secure interfaces for Company Managers, Purchase Officers (POs), and external Vendors.
Automated OTP Verification: Secure email verification using Resend API with custom intercept mapping for local testing.
RFQ & Quotation Engine: Create complex Requests for Quotation (RFQs) and allow vendors to submit detailed pricing bids.
Automated Purchase Orders: Instantly convert manager-approved quotations into official Purchase Orders with automatic tax calculations (GST) and Indian numbering conventions (Lakhs/Crores).
Dynamic Invoicing & PDF Export: Auto-generate commercial invoices and download pixel-perfect, styled PDF documents using jsPDF and html2canvas.
Real-Time Analytics Dashboard: Track active RFQs, pending approvals, and visualize spending trends via responsive, gradient-filled Area Charts powered by Recharts.
Indian Market Localization: Full support for the Indian Rupee (₹) and regional pricing conventions.
🛠️ Technology Stack
Frontend

React.js (Vite)
Tailwind CSS (v4)
React Router
Redux Toolkit (State Management)
Recharts (Data Visualization)
jsPDF & html2canvas (PDF Generation)
Backend

Node.js & Express.js
MongoDB & Mongoose
JSON Web Tokens (JWT) & bcryptjs (Authentication)
Resend API (Email Services)
🚀 Getting Started
Prerequisites
Node.js (v18+)
MongoDB locally installed or a MongoDB Atlas URI
A Resend API key for email OTP features
1. Backend Setup
Navigate to the backend directory:
bash


cd backend
Install dependencies:
bash


npm install
Create a .env file in the backend directory and add the following variables:
env


PORT=3000
DB_URL=mongodb://localhost:27017/vendorbridge
JWT_SECRET=your_super_secret_jwt_key
RESEND_API_KEY=your_resend_api_key
Start the backend server:
bash


npm start
2. Frontend Setup
Open a new terminal and navigate to the frontend directory:
bash


cd Frontend
Install dependencies:
bash


npm install
Start the Vite development server:
bash


npm run dev
🧪 Mock Data Seeding
To quickly populate your local database with realistic Indian vendor profiles, historical RFQs, Purchase Orders, and Invoices to view the analytics dashboard in action:

Ensure the backend server is running.
In the backend directory, run the seeder script:
bash


node src/scripts/seed.js
The script will output testing credentials for a mock Vendor account right in your console.
