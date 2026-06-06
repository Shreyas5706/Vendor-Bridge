import React from 'react';
import Bridge from "../../../src/assets/Bridge.png"
import {Link} from "react-router-dom"
export default function CleanLandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-100">
      
    

      {/* Navbar */}
      <nav className="border-b border-slate-100 bg-white/90 sticky top-0 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          
          {/* Logo Container with dedicated extra padding/space for custom brand image asset */}
          <div className="flex items-center gap-1 py-1 pl-2">
            <img src={Bridge} alt="Logo" className="h-10 w-fit object-contain" />
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Vendor<span className="text-blue-600">Bridge</span>
              </h1>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold -mt-0.5">
                Procurement & Vendor ERP
              </p>
            </div>
          </div>

          {/* Combined Navigation and Action Hub grouped tightly on the right side */}
          <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-6 text-sm font-semibold text-slate-600">
              <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
              <a href="#workflow" className="hover:text-blue-600 transition-colors">Process Map</a>
            </div>

            <Link to={"/login"}>
            <button  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 font-semibold text-sm text-white shadow-sm transition-all whitespace-nowrap">
              Portal Login
            </button></Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-100">
        {/* Subtle high-tech world network graphic background mask */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none flex items-center justify-center mix-blend-multiply scale-110">
          <img 
            src="https://png.pngtree.com/thumb_back/fh260/background/20240913/pngtree-global-connectivity-and-technical-networks-are-shown-by-an-abstract-digital-image_16197642.jpg" 
            alt="World Map Supply Chain Pattern Graphic Overlay" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-20 pb-24 grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Content Info */}
          <div className="space-y-6 lg:col-span-6 text-center lg:text-left">
          
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
              Smarter Procurement.
              <span className="block mt-1 text-blue-600">
                Stronger Partnerships.
              </span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Digitize your entire supply cycle. Streamline structured RFQs, multi-vendor rate matrix comparisons, internal leadership signatures, and legal PO release patterns inside a clean, modern framework.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
              <button className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/10 transition-all">
                Access Workspace Console
              </button>
              <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-white font-bold text-sm text-slate-700 transition-all">
                <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                Watch System Demo
              </button>
            </div>
          </div>

          {/* Light-Theme Live Dashboard Hero Widget */}
          <div className="lg:col-span-6 relative">
            <div className="absolute inset-0 bg-blue-600/5 rounded-3xl blur-2xl pointer-events-none" />
            
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 p-4 font-sans text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="text-[11px] font-mono text-slate-400 font-bold ml-2">vendorbridge-dashboard-v2</span>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-mono font-bold">LIVE METRIC FEED</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Active RFQs</span>
                  <span className="text-base font-black font-mono text-slate-800">14 Open</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Bids Lodged</span>
                  <span className="text-base font-black font-mono text-blue-600">42 Units</span>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl">
                  <span className="text-[9px] text-amber-700/70 font-bold block uppercase tracking-wider">Pending Signoff</span>
                  <span className="text-base font-black font-mono text-amber-700">3 Orders</span>
                </div>
              </div>

              <div className="border border-slate-200/70 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="bg-slate-50/80 px-3 py-2 border-b border-slate-200/70 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">RFQ-2026-001 Matrix Comparison</span>
                  <span className="text-[10px] font-mono text-slate-400">Product: Enterprise Laptops</span>
                </div>
                
                <div className="p-1 divide-y divide-slate-100 text-[11px]">
                  <div className="flex items-center justify-between p-2 bg-blue-50/30 rounded-lg">
                    <div>
                      <span className="font-bold text-slate-800 block">Alpha Tech Solutions</span>
                      <span className="text-[10px] text-slate-400 font-mono">Delivery Window: 5 Days</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 block">₹45,000</span>
                      <span className="text-[9px] text-amber-600 font-mono font-bold uppercase bg-amber-50 px-1 rounded border border-amber-200">RECOMMENDED</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <div>
                      <span className="font-semibold text-slate-700 block">Beta Digital Systems</span>
                      <span className="text-[10px] text-slate-400 font-mono">Delivery Window: 8 Days</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-medium text-slate-600 block">₹43,000</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> 3-Way Match Validation Active</span>
                <span className="font-mono text-blue-600 font-bold cursor-pointer hover:underline">Launch App Studio &rarr;</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Connected 8-Step Flow Map Section */}
      <section id="workflow" className="bg-slate-50 border-y border-slate-200/60 py-24 scroll-mt-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Basic Platform Workflow Map
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Trace operations linearly across structural stage limits from instantiation down to logs extraction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6 relative">
            {[
              { step: "01", title: "RFQ Creation", desc: "Procurement Officer initiates and creates structural RFQ guidelines.", icon: "📄" },
              { step: "02", title: "Vendor Inbound", desc: "Registered suppliers receive immediate invites & lodge digital quotes.", icon: "📥" },
              { step: "03", title: "Matrix Analysis", desc: "Procurement systems compare rates, SLA timelines, and historic metrics.", icon: "📊" },
              { step: "04", title: "Approval Chain", desc: "Configurable hierarchical verification triggers across management loops.", icon: "👔" },
              { step: "05", title: "PO Dispatch", desc: "System locks confirmed quotes and prints a canonical Purchase Order.", icon: "✨" },
              { step: "06", title: "Invoice Matching", desc: "Commercial Invoice elements derive cleanly out from specific PO values.", icon: "🏛️" },
              { step: "07", title: "Direct Routing", desc: "Invoices print instantly or dispatch to vendor interfaces via internal email wire.", icon: "✉️" },
              { step: "08", title: "View Ledger", desc: "Every operation archives cleanly within dynamic analytical dashboards.", icon: "📈" }
            ].map((node, i) => (
              <div key={i} className="relative bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:border-blue-500/50 hover:shadow-md transition-all duration-300 group">
                
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">STEP {node.step}</span>
                  <span className="text-xl filter group-hover:scale-110 transition-transform">{node.icon}</span>
                </div>

                <div className="space-y-1 mt-2">
                  <h4 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">{node.title}</h4>
                  <p className="text-slate-600 text-xs leading-relaxed font-normal">{node.desc}</p>
                </div>

                {/* SVG Connecting Linear Flow Arrows */}
                {i < 7 && (
                  <div className="absolute top-1/2 -right-3.5 z-20 -translate-y-1/2 pointer-events-none text-slate-300 hidden lg:block translate-x-0.5 group-hover:text-blue-400 transition-colors">
                    {(i + 1) % 4 !== 0 ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Platform Specification Feature Cards Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 sm:px-10 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Platform Specifications
          </h2>
          <p className="text-slate-500 text-base mt-2">
            No endless message threads or messy spreadsheets. Run clean linear logic from standard unified nodes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Structured RFQ Matrix", desc: "Build exact count specifications, set submission targets, and broadcast to registered vendor blocks instantly.", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
            { title: "Analytical Quotation Compare", desc: "Automated grid layouts pitting baseline rates, delivery windows, corporate grades, and compliance matrices side by side.", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { title: "Hierarchical Control Signoffs", desc: "Configurable approval levels. Holds recommendations securely under escrow locks until management authorizes fund dispersion.", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            { title: "Purchase Order Automation", desc: "Auto-populates validated winning quotation data directly into institutional PO forms tracking unique token indexes.", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
            { title: "3-Way Match Invoicing", desc: "Cross-checks corresponding Purchase Orders, Goods Received Notes, and Incoming Supplier Billing slips to avoid leakage.", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { title: "Immutable Trail Ledgers", desc: "Every state mutation, signature authorization, and system dispatch logs instantly onto an auditable sequence view.", icon: "M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-6 hover:bg-white hover:border-blue-500/40 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-700 mb-4 shadow-xs">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 sm:px-10 py-12 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>&copy; 2026 VendorBridge Solutions Group Ecosystem. Internal Console Node. All rights reserved.</p>
        <div className="flex gap-6 font-medium text-slate-500">
          <a href="#" className="hover:text-slate-800 transition-colors">Privacy Policies</a>
        </div>
      </footer>
    </div>
  );
}