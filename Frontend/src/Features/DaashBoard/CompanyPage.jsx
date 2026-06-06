import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../auth/auth.slice';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import BridgeLoader from '../../components/BridgeLoader';
import BridgeIcon from '../../assets/Bridge.png';
import Sidebar from '../../components/Sidebar';

/**
 * Company Dashboard Screen
 * Includes a sticky sidebar (from mockup) to navigate between:
 * - Dashboard (Overview, spend trends, stats, recent POs)
 * - Vendors (Profile list, categories, status filters, add vendor)
 * - RFQ's (Active/Inactive RFQs list, 3-step creation wizard)
 * - Quotations (Comparison matrix, lowest price highlight)
 * - Approvals (Approval timeline stepper, remarks, signoffs)
 * - Purchase orders (Release patterns, issued statuses)
 * - Invoices (Commercial invoice ledgers, 3-way matching)
 * - Reports (Spending summaries, vendor grading charts)
 * - Activity (Audit logs & company staff/team list)
 */
const CompanyPage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // State Management
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'vendors', 'rfqs', 'quotations', 'approvals', 'pos', 'invoices', 'reports', 'activity'
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter States
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all'); // 'all', 'active', 'pending', 'blocked'
  const [rfqSearch, setRfqSearch] = useState('');

  // Add Vendor Modal State
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendorData, setNewVendorData] = useState({
    name: '',
    email: '',
    contactNo: '',
    country: '',
    description: '',
  });
  const [addVendorError, setAddVendorError] = useState(null);
  const [addVendorSuccess, setAddVendorSuccess] = useState(false);

  // RFQ Creation Wizard State (Screen 5 style)
  const [rfqStep, setRfqStep] = useState(1); // 1: Details, 2: Add Items, 3: Select Vendors
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqCategory, setRfqCategory] = useState('Furniture');
  const [rfqDeadline, setRfqDeadline] = useState('');
  const [rfqDescription, setRfqDescription] = useState('');
  const [rfqItems, setRfqItems] = useState([
    { productName: 'Ergonomic chair', quantity: 20, unit: 'pcs' },
    { productName: 'Standing desks', quantity: 10, unit: 'pcs' }
  ]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [rfqSuccessMsg, setRfqSuccessMsg] = useState('');
  const [rfqErrorMsg, setRfqErrorMsg] = useState('');

  // Approvals State
  const [approvingQuote, setApprovingQuote] = useState(null);
  const [mockQuotations, setMockQuotations] = useState([
    {
      criteria: 'Grand Total',
      infra: '₹1,85,000',
      techserv: '₹2,00,000',
      officewood: '₹2,10,000',
      isPrice: true,
    },
    {
      criteria: 'GST %',
      infra: '18%',
      techserv: '18%',
      officewood: '18%',
    },
    {
      criteria: 'Delivery (days)',
      infra: '10 days',
      techserv: '14 days',
      officewood: '7 days',
    },
    {
      criteria: 'Vendor Rating',
      infra: '4.6 / 5',
      techserv: '4.2 / 5',
      officewood: '4.8 / 5',
    }
  ]);

  const [mockPOs, setMockPOs] = useState([
    { poNumber: 'PO-2026-0001', vendor: 'Infra Supplies Pvt Ltd', amount: '₹1,85,000', status: 'Approved', date: '2026-05-22' },
    { poNumber: 'PO-2026-0002', vendor: 'Tech Serv LTD', amount: '₹1,40,000', status: 'Pending', date: '2026-06-01' },
    { poNumber: 'PO-2026-0003', vendor: 'Fastline Transports', amount: '₹35,000', status: 'Approved', date: '2026-06-04' }
  ]);

  const [mockInvoices, setMockInvoices] = useState([
    { invNumber: 'INV-2026-0001', poNumber: 'PO-2026-0001', vendor: 'Infra Supplies Pvt Ltd', amount: '₹1,85,000', status: 'Paid', date: '2026-05-24' },
    { invNumber: 'INV-2026-0002', poNumber: 'PO-2026-0003', vendor: 'Fastline Transports', amount: '₹35,000', status: 'Unpaid', date: '2026-06-05' }
  ]);

  const [activityLogs, setActivityLogs] = useState([
    { message: 'Purchase Officer Nidhi created RFQ-2026-001', actor: 'PO', time: '1 hour ago' },
    { message: 'Vendor Infra Supplies submitted quotation for RFQ-2026-001', actor: 'Vendor', time: '3 hours ago' },
    { message: 'Manager Priya Shah approved RFQ-2026-001 quotation comparison', actor: 'Manager', time: '1 day ago' },
    { message: 'New Vendor Fastline Transports was registered by admin', actor: 'Admin', time: '2 days ago' }
  ]);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      };
      const response = await axios.get('http://localhost:3000/api/auth/company-dashboard', config);
      if (response.data.success) {
        setDashboardData(response.data);
      } else {
        setError(response.data.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
      setError(err.response?.data?.message || 'Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Handle Add Vendor Submission
  const handleAddVendorSubmit = async (e) => {
    e.preventDefault();
    setAddVendorError(null);
    setAddVendorSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      };

      const response = await axios.post(
        'http://localhost:3000/api/auth/register',
        {
          role: 'VENDOR',
          ...newVendorData,
        },
        config
      );

      if (response.data.success) {
        setAddVendorSuccess(true);
        setNewVendorData({ name: '', email: '', contactNo: '', country: '', description: '' });
        // Refresh dashboard data to reflect new vendor
        await fetchDashboard();
        setTimeout(() => {
          setShowAddVendor(false);
          setAddVendorSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Add vendor error:', err);
      setAddVendorError(err.response?.data?.message || 'Failed to register vendor');
    }
  };

  const handleCreateRFQSubmit = async () => {
    setRfqErrorMsg('');
    setRfqSuccessMsg('');

    if (!rfqTitle || !rfqDeadline) {
      setRfqErrorMsg('Please specify RFQ Title and Deadline.');
      return;
    }

    if (rfqItems.length === 0) {
      setRfqErrorMsg('Please add at least one item specification.');
      return;
    }

    if (selectedVendors.length === 0) {
      setRfqErrorMsg('Please select/assign at least one Vendor.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      };

      const payload = {
        title: rfqTitle,
        description: rfqDescription,
        items: rfqItems,
        deadline: rfqDeadline,
        assignedVendors: selectedVendors,
      };

      const response = await axios.post('http://localhost:3000/api/auth/rfq', payload, config);

      if (response.data.success) {
        setRfqSuccessMsg('RFQ created successfully and sent to assigned vendors!');
        // Reset states
        setRfqTitle('');
        setRfqDeadline('');
        setRfqDescription('');
        setRfqItems([{ productName: 'Ergonomic chair', quantity: 20, unit: 'pcs' }]);
        setSelectedVendors([]);
        setRfqStep(1);
        await fetchDashboard();
        setTimeout(() => {
          setRfqSuccessMsg('');
          setCurrentView('rfqs');
        }, 1500);
      }
    } catch (err) {
      console.error('Create RFQ error:', err);
      setRfqErrorMsg(err.response?.data?.message || 'Failed to create RFQ. Ensure your session is active.');
    }
  };

  const handleApproveQuotation = async (quotationId) => {
    try {
      setApprovingQuote(quotationId);
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:3000/api/auth/quotation/${quotationId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      if (response.data.success) {
        alert(response.data.message);
        fetchDashboard(); // Refresh all data to show new statuses
      }
    } catch (err) {
      console.error('Approve quotation error:', err);
      alert(err.response?.data?.message || 'Failed to approve quotation');
    } finally {
      setApprovingQuote(null);
    }
  };

  const [generatingPO, setGeneratingPO] = useState(null);
  const handleGeneratePO = async (quotationId) => {
    try {
      setGeneratingPO(quotationId);
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:3000/api/auth/po/generate`, { quotationId }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      if (response.data.success) {
        alert(response.data.message);
        fetchDashboard(); 
        setCurrentView('pos'); // Navigate to POs tab
      }
    } catch (err) {
      console.error('Generate PO error:', err);
      alert(err.response?.data?.message || 'Failed to generate PO');
    } finally {
      setGeneratingPO(null);
    }
  };

  const [generatingInvoice, setGeneratingInvoice] = useState(null);
  const handleGenerateInvoice = async (poId) => {
    try {
      setGeneratingInvoice(poId);
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:3000/api/auth/invoice/generate`, { poId }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      if (response.data.success) {
        alert(response.data.message);
        fetchDashboard(); 
        setCurrentView('invoices'); // Navigate to Invoices tab
      }
    } catch (err) {
      console.error('Generate Invoice error:', err);
      alert(err.response?.data?.message || 'Failed to generate Invoice');
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const handleDownloadPDF = async (elementId, filename) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF");
    }
  };

  if (loading) {
    return <BridgeLoader fullscreen message="Initialising VendorBridge Console..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-mono">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50/40 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600">
            ⚠
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider">Console Error</h2>
          <p className="text-slate-500 text-xs">{error}</p>
          <div className="flex gap-3 justify-center pt-2">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded text-xs font-bold transition-all cursor-pointer"
            >
              Retry
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded text-xs font-bold transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { company, rfqs, vendors, quotations, pos, invoices } = dashboardData || {};

  // Filters for vendor page
  const filteredVendors = vendors?.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      (vendor.description && vendor.description.toLowerCase().includes(vendorSearch.toLowerCase())) ||
      (vendor.contactNo && vendor.contactNo.includes(vendorSearch));
    
    if (vendorFilter === 'all') return matchesSearch;
    if (vendorFilter === 'active') return matchesSearch && vendor.status === 'ACTIVE';
    if (vendorFilter === 'pending') return matchesSearch && vendor.status === 'PENDING';
    if (vendorFilter === 'blocked') return matchesSearch && vendor.status === 'INACTIVE';
    return matchesSearch;
  }) || [];

  // -------------------------------------------------------------
  // DASHBOARD CALCULATIONS
  // -------------------------------------------------------------
  const activeRfqsCount = rfqs?.filter(r => r.status === 'ACTIVE').length || 0;
  const pendingQuotationsCount = quotations?.filter(q => q.status === 'PENDING').length || 0;
  
  // Helper for Indian Currency Formatting (e.g. ₹2.3L, ₹1.5Cr)
  const formatIndianCurrency = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
    return `₹${amount.toFixed(0)}`;
  };

  // Total Spend = Sum of all approved Purchase Orders
  const totalSpend = pos?.reduce((sum, po) => sum + (po.grandTotal || 0), 0) || 0;
  const formattedSpend = formatIndianCurrency(totalSpend);

  // Generate Chart Data for Last 4 Months based on POs (Manager Approvals)
  const last4Months = Array.from({length: 4}, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (3 - i));
    return d.toLocaleString('default', { month: 'short' });
  });

  const spendByMonth = {};
  pos?.forEach(po => {
    const d = new Date(po.createdAt);
    const month = d.toLocaleString('default', { month: 'short' });
    spendByMonth[month] = (spendByMonth[month] || 0) + (po.grandTotal || 0);
  });

  const maxSpend = Math.max(...last4Months.map(m => spendByMonth[m] || 0), 100); 
  const chartData = last4Months.map(month => {
    const amount = spendByMonth[month] || 0;
    return { month, amountRaw: amount, formattedAmount: formatIndianCurrency(amount) };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl border border-slate-700">
          <p className="font-bold uppercase tracking-wider mb-1">{label}</p>
          <p className="text-blue-400 font-mono text-sm">{payload[0].payload.formattedAmount}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans selection:bg-blue-50 selection:text-blue-600">
      
      {/* ======================================================== */}
      {/* STICKY LEFT SIDEBAR (Screen 3, 4, 5 Mockup style) */}
      {/* ======================================================== */}
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      {/* ======================================================== */}
      {/* RIGHT MAIN VIEW PANEL */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md z-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 font-mono">
            Company Terminal: <span className="text-slate-900">{company?.name}</span>
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[9px] bg-slate-100 border border-slate-300 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
              Country: {company?.country || 'Global'}
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
          </div>
        </header>

        {/* Content Pane */}
        <main className="p-8 flex-1 overflow-y-auto space-y-8">

          {/* ======================================================== */}
          {/* VIEW: DASHBOARD (Screen 3 style) */}
          {/* ======================================================== */}
          {currentView === 'dashboard' && (
            <div className="space-y-8">
              {/* Titles */}
              <div>
                <h3 className="text-2xl font-black text-slate-900">Dashboard</h3>
                <p className="text-slate-500 text-xs mt-1">Welcome back, Procurement Administrator — Today's Overview</p>
              </div>

              {/* KPI metrics row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded space-y-2">
                  <span className="text-[10px] text-slate-500 font-black block uppercase tracking-wider">Active RFQ's</span>
                  <span className="text-3xl font-black font-mono text-slate-900">{activeRfqsCount}</span>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded space-y-2">
                  <span className="text-[10px] text-slate-500 font-black block uppercase tracking-wider">Pending Approvals</span>
                  <span className="text-3xl font-black font-mono text-blue-600">{pendingQuotationsCount}</span>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded space-y-2 relative group cursor-help">
                  <span className="text-[10px] text-slate-500 font-black block uppercase tracking-wider">Total spend (Approved)</span>
                  <span className="text-3xl font-black font-mono text-slate-900">{formattedSpend}</span>
                </div>
              </div>

              {/* Table & Spending Chart Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Recent Purchase Orders Table */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded p-5 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 pb-2 border-b border-slate-200">
                    Recent Purchase Orders (Accepted By Manager)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[9px] text-slate-500 font-black uppercase tracking-wider">
                          <th className="py-2.5">PO #</th>
                          <th className="py-2.5">Vendor</th>
                          <th className="py-2.5">Amount</th>
                          <th className="py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {pos && pos.length > 0 ? pos.slice(0, 5).map((po, i) => (
                          <tr key={i} className="hover:bg-slate-100/30 transition-colors">
                            <td className="py-3 font-mono font-bold text-slate-600">{po.poNumber}</td>
                            <td className="py-3 text-slate-500">{po.vendorId?.name || 'Unknown Vendor'}</td>
                            <td className="py-3 font-mono text-slate-600">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(po.grandTotal || 0)}
                            </td>
                            <td className="py-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                po.status === 'ISSUED' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              }`}>
                                {po.status}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="4" className="py-3 text-center text-slate-500">No POs found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Spending Trends Widget */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded p-5 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 pb-2 border-b border-slate-200">
                    Spending Trends (Last 4 Months)
                  </h4>
                  {/* Recharts Area Graph representation */}
                  <div className="h-40 pt-4 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}
                          tickFormatter={(val) => val === 0 ? '₹0' : formatIndianCurrency(val)}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area 
                          type="monotone" 
                          dataKey="amountRaw" 
                          stroke="#2563eb" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorSpend)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Quick Action Buttons row */}
              <div className="flex flex-wrap gap-4 pt-2">
                <button 
                  onClick={() => {
                    setCurrentView('rfqs');
                    setRfqStep(1); // Set to wizard start
                  }}
                  className="px-5 py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-blue-100/10 cursor-pointer"
                >
                  Create RFQ's
                </button>
                  
                <button 
                  onClick={() => setCurrentView('invoices')}
                  className="px-5 py-2.5 rounded bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  View Invoices
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: VENDORS (Screen 4 style) */}
          {/* ======================================================== */}
          {currentView === 'vendors' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Vendors</h3>
                  <p className="text-slate-500 text-xs mt-1">Manage supplier profiles and registrations</p>
                </div>
                
              </div>

              {/* Search input */}
              <div className="bg-white border border-slate-200 p-4 rounded space-y-4">
                <input
                  type="text"
                  placeholder="Search bar — search by name, gst number, category..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-mono"
                />

                {/* Filter pills */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: 'all', label: `All (${vendors?.length || 0})` },
                    { id: 'active', label: `Active (${vendors?.filter(v=>v.status==='ACTIVE').length || 0})` },
                    { id: 'pending', label: `Pending (0)` },
                    { id: 'blocked', label: `Blocked (${vendors?.filter(v=>v.status==='INACTIVE').length || 0})` }
                  ].map(pill => (
                    <button
                      key={pill.id}
                      onClick={() => setVendorFilter(pill.id)}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                        vendorFilter === pill.id
                          ? 'bg-blue-50/80 text-blue-600 border-blue-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vendors List Table */}
              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[9px] text-slate-500 font-black uppercase tracking-wider bg-slate-50/30">
                        <th className="py-3 px-5">Vendor Name</th>
                        <th className="py-3 px-5">Category</th>
                        <th className="py-3 px-5">GST No.</th>
                        <th className="py-3 px-5">Contact No.</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredVendors.length > 0 ? (
                        filteredVendors.map((vendor, idx) => (
                          <tr key={idx} className="hover:bg-slate-100/30 transition-colors">
                            <td className="py-4 px-5">
                              <span className="font-bold text-slate-700 block">{vendor.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono block">{vendor.email}</span>
                            </td>
                            <td className="py-4 px-5 text-slate-500 font-mono uppercase tracking-wider text-[10px]">
                              {vendor.category || 'IT Services'}
                            </td>
                            <td className="py-4 px-5 text-slate-500 font-mono font-semibold">
                              {vendor.gstNumber || '27AAACG1234F1Z0'}
                            </td>
                            <td className="py-4 px-5 text-slate-500 font-mono">
                              {vendor.contactNo || 'N/A'}
                            </td>
                            <td className="py-4 px-5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                vendor.status === 'ACTIVE' 
                                  ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                                  : 'bg-rose-50 text-rose-600 border border-rose-200'
                              }`}>
                                {vendor.status === 'ACTIVE' ? 'Active' : 'Blocked'}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <button className="px-2.5 py-1 bg-slate-100 border border-slate-300 hover:border-slate-600 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer">
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-500 font-mono">
                            No registered vendors found matching search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: RFQ'S (Screen 5 style) */}
          {/* ======================================================== */}
          {currentView === 'rfqs' && (
            <div className="space-y-6">
              
              {/* Header with toggle */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Create RFQ's</h3>
                  <p className="text-slate-500 text-xs mt-1">new request for quotation</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRfqStep(1)}
                    className={`px-4 py-2 rounded text-xs font-black uppercase tracking-wider cursor-pointer ${
                      rfqStep === 1 ? 'bg-slate-100 text-slate-900' : 'bg-white/40 text-slate-500 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    Creation Wizard
                  </button>
                  <button
                    onClick={() => setRfqStep(0)} // Special status: List RFQs
                    className={`px-4 py-2 rounded text-xs font-black uppercase tracking-wider cursor-pointer ${
                      rfqStep === 0 ? 'bg-slate-100 text-slate-900' : 'bg-white/40 text-slate-500 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    View RFQ List
                  </button>
                </div>
              </div>

              {/* STEP 0: RFQ LIST VIEW */}
              {rfqStep === 0 && (
                <div className="bg-white border border-slate-200 rounded overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/30 flex justify-between items-center">
                    <span className="font-bold text-xs uppercase text-slate-500">Company RFQ Records</span>
                    <span className="text-[10px] text-slate-500 font-mono">{rfqs?.length || 0} Open RFQs</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[9px] text-slate-500 font-black uppercase tracking-wider bg-slate-50/20">
                          <th className="py-3 px-5">RFQ Title</th>
                          <th className="py-3 px-5">Category</th>
                          <th className="py-3 px-5">Issuing PO</th>
                          <th className="py-3 px-5">Deadline</th>
                          <th className="py-3 px-5">Assigned</th>
                          <th className="py-3 px-5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {rfqs && rfqs.length > 0 ? (
                          rfqs.map((rfq, idx) => (
                            <tr key={idx} className="hover:bg-slate-100/30 transition-colors">
                              <td className="py-3.5 px-5">
                                <span className="font-bold text-slate-700 block">{rfq.title}</span>
                                <span className="text-[10px] text-slate-500 max-w-xs truncate block">{rfq.description || 'No Description'}</span>
                              </td>
                              <td className="py-3.5 px-5 text-slate-500 font-semibold">{rfq.category || 'Furniture'}</td>
                              <td className="py-3.5 px-5">
                                <span className="text-slate-600 block">{rfq.createdBy?.name || 'PO'}</span>
                                <span className="text-[9px] text-slate-500 block font-mono">{rfq.createdBy?.email}</span>
                              </td>
                              <td className="py-3.5 px-5 text-slate-500 font-mono">
                                {new Date(rfq.deadline).toLocaleDateString()}
                              </td>
                              <td className="py-3.5 px-5 text-slate-500 font-mono font-bold">
                                {rfq.assignedVendors?.length || 0} Vendors
                              </td>
                              <td className="py-3.5 px-5 text-right">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                  rfq.status === 'ACTIVE' 
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                                }`}>
                                  {rfq.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-500 font-mono">
                              No RFQ submissions created yet. Start in the creation wizard.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STEPS 1-3: CREATION WIZARD (Screen 5 layout) */}
              {rfqStep > 0 && (
                <div className="bg-white border border-slate-200 rounded p-6 space-y-6">
                  
                  {/* Step Indicators */}
                  <div className="flex justify-between items-center max-w-lg mx-auto relative">
                    <div className="absolute left-0 right-0 h-0.5 bg-slate-100 top-1/2 -translate-y-1/2 z-0" />
                    {[
                      { num: 1, label: 'RFQ Details' },
                      { num: 2, label: 'Add Items' },
                      { num: 3, label: 'Assign Vendors' }
                    ].map(step => (
                      <div key={step.num} className="flex flex-col items-center gap-1.5 relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                          rfqStep === step.num
                            ? 'bg-blue-600 text-white border-blue-600 font-black'
                            : rfqStep > step.num
                            ? 'bg-slate-100 text-blue-600 border-blue-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {step.num}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          rfqStep === step.num ? 'text-blue-600' : 'text-slate-500'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Feedback Messages */}
                  {rfqSuccessMsg && (
                    <div className="bg-blue-50/80 border border-blue-200 text-blue-600 p-4 rounded text-xs text-center font-mono">
                      ✓ {rfqSuccessMsg}
                    </div>
                  )}
                  {rfqErrorMsg && (
                    <div className="bg-rose-50/80 border border-rose-200 text-rose-600 p-4 rounded text-xs text-center font-mono">
                      ⚠ {rfqErrorMsg}
                    </div>
                  )}

                  {/* Form Container */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
                    
                    {/* LEFT FORM FIELDS COLUMN */}
                    <div className="lg:col-span-7 space-y-4">
                      
                      {/* STEP 1: RFQ DETAILS */}
                      {rfqStep === 1 && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">RFQ Title *</label>
                            <input
                              type="text"
                              value={rfqTitle}
                              onChange={(e) => setRfqTitle(e.target.value)}
                              placeholder="e.g., Office Furniture Procurement Q2"
                              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Category</label>
                              <select
                                value={rfqCategory}
                                onChange={(e) => setRfqCategory(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                              >
                                <option value="Furniture">Furniture</option>
                                <option value="IT Hardware">IT Hardware</option>
                                <option value="Office Supplies">Office Supplies</option>
                                <option value="Logistics">Logistics</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Deadline *</label>
                              <input
                                type="date"
                                value={rfqDeadline}
                                onChange={(e) => setRfqDeadline(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Description</label>
                            <textarea
                              rows="4"
                              value={rfqDescription}
                              onChange={(e) => setRfqDescription(e.target.value)}
                              placeholder="Describe the items, specifications, terms and conditions..."
                              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* STEP 2: ADD ITEMS TABLE */}
                      {rfqStep === 2 && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Line Item Specifications</span>
                            <button
                              type="button"
                              onClick={() => setRfqItems([...rfqItems, { productName: '', quantity: 1, unit: 'pcs' }])}
                              className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                            >
                              + add line item
                            </button>
                          </div>

                          <div className="space-y-3">
                            {rfqItems.map((item, index) => (
                              <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded border border-slate-200">
                                <div className="col-span-6 space-y-1">
                                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider">Product Description</span>
                                  <input
                                    type="text"
                                    value={item.productName}
                                    onChange={(e) => {
                                      const updated = [...rfqItems];
                                      updated[index].productName = e.target.value;
                                      setRfqItems(updated);
                                    }}
                                    placeholder="e.g., Ergonomic Chair"
                                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 focus:outline-none"
                                  />
                                </div>
                                <div className="col-span-3 space-y-1">
                                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider">Qty</span>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const updated = [...rfqItems];
                                      updated[index].quantity = parseInt(e.target.value) || 0;
                                      setRfqItems(updated);
                                    }}
                                    min="1"
                                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 focus:outline-none font-mono"
                                  />
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider">Unit</span>
                                  <input
                                    type="text"
                                    value={item.unit}
                                    onChange={(e) => {
                                      const updated = [...rfqItems];
                                      updated[index].unit = e.target.value;
                                      setRfqItems(updated);
                                    }}
                                    placeholder="pcs"
                                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 focus:outline-none"
                                  />
                                </div>
                                <div className="col-span-1 pt-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setRfqItems(rfqItems.filter((_, i) => i !== index))}
                                    className="text-rose-600 font-bold hover:text-rose-600 text-xs cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* STEP 3: VENDOR SELECTION */}
                      {rfqStep === 3 && (
                        <div className="space-y-4">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider pb-2 border-b border-slate-200">
                            Assign Target Vendors
                          </span>
                          
                          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800 bg-slate-50 p-2 border border-slate-200 rounded">
                            {vendors && vendors.length > 0 ? (
                              vendors.map((v, i) => (
                                <label key={i} className="flex items-center gap-3 p-2.5 hover:bg-white/60 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedVendors.includes(v._id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedVendors([...selectedVendors, v._id]);
                                      } else {
                                        setSelectedVendors(selectedVendors.filter(id => id !== v._id));
                                      }
                                    }}
                                    className="rounded text-blue-600 bg-white border-slate-200 focus:ring-blue-600"
                                  />
                                  <div className="text-xs">
                                    <span className="font-bold text-slate-700 block">{v.name}</span>
                                    <span className="text-[9px] text-slate-500 font-mono">{v.email} | {v.category || 'IT Services'}</span>
                                  </div>
                                </label>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500 p-4 text-center">No vendors found. Please add a vendor first.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Wizard Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-slate-200">
                        {rfqStep > 1 && (
                          <button
                            type="button"
                            onClick={() => setRfqStep(rfqStep - 1)}
                            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded text-xs font-bold transition-all cursor-pointer"
                          >
                            Back Step
                          </button>
                        )}
                        {rfqStep < 3 ? (
                          <button
                            type="button"
                            onClick={() => setRfqStep(rfqStep + 1)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded text-xs uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Continue
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleCreateRFQSubmit}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Save & Send to Vendors
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRfqSuccessMsg('RFQ saved as draft successfully!');
                                setTimeout(() => {
                                  setRfqSuccessMsg('');
                                  setCurrentView('rfqs');
                                  setRfqStep(0);
                                }, 1200);
                              }}
                              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded text-xs font-bold cursor-pointer"
                            >
                              Save as Draft
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* RIGHT FILE ATTACHMENT BOX COLUMN */}
                    <div className="lg:col-span-5 space-y-4">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Attachments</span>
                      
                      <div className="border-2 border-dashed border-slate-200 hover:border-blue-600/50 bg-slate-50 p-8 rounded-xl text-center space-y-2 cursor-pointer transition-colors group">
                        <span className="text-3xl block filter group-hover:scale-110 transition-transform">☁</span>
                        <p className="text-xs font-bold text-slate-600">Drag & drop files or click to upload</p>
                        <p className="text-[9px] text-slate-600 font-mono">PDF, DOCX, XLSX (max 5MB)</p>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: QUOTATIONS (Screen 6 comparison style) */}
          {/* ======================================================== */}
          {currentView === 'quotations' && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h3 className="text-2xl font-black text-slate-900">Quotations Received</h3>
                <p className="text-slate-500 text-xs mt-1">Review and compare submitted quotes</p>
              </div>

              {/* Quotations List */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-3 px-4 text-slate-500 font-black uppercase tracking-wider text-[10px]">RFQ Title</th>
                        <th className="py-3 px-4 text-slate-500 font-black uppercase tracking-wider text-[10px]">Vendor</th>
                        <th className="py-3 px-4 text-slate-500 font-black uppercase tracking-wider text-[10px]">Total Amount</th>
                        <th className="py-3 px-4 text-slate-500 font-black uppercase tracking-wider text-[10px]">Notes</th>
                        <th className="py-3 px-4 text-slate-500 font-black uppercase tracking-wider text-[10px]">Date</th>
                        <th className="py-3 px-4 text-right text-slate-500 font-black uppercase tracking-wider text-[10px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quotations && quotations.length > 0 ? (
                        quotations.map((q, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-4 px-4 font-bold text-slate-700">{q.rfqId?.title || 'Unknown RFQ'}</td>
                            <td className="py-4 px-4 text-slate-600">{q.vendorId?.name || 'Unknown Vendor'}</td>
                            <td className="py-4 px-4 font-mono font-bold text-blue-600">₹{q.totalAmount?.toFixed(2)}</td>
                            <td className="py-4 px-4 text-slate-500 max-w-[200px] truncate">{q.deliveryNotes || '-'}</td>
                            <td className="py-4 px-4 text-slate-500 font-mono">{new Date(q.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                q.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                q.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {q.status || 'PENDING'}
                              </span>
                              
                              {/* Show Generate PO if ACCEPTED and we haven't already generated a PO */}
                              {q.status === 'ACCEPTED' && !pos?.some(p => p.quotationId === q._id) && (
                                <button
                                  onClick={() => handleGeneratePO(q._id)}
                                  disabled={generatingPO === q._id}
                                  className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-[9px] font-bold uppercase tracking-wider transition-colors"
                                >
                                  {generatingPO === q._id ? 'Generating...' : 'Generate PO'}
                                </button>
                              )}
                              {q.status === 'ACCEPTED' && pos?.some(p => p.quotationId === q._id) && (
                                <span className="ml-2 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wider">
                                  PO Generated
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500 font-mono">No quotations received yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: APPROVALS */}
          {/* ======================================================== */}
          {currentView === 'approvals' && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h3 className="text-2xl font-black text-slate-900">Quotation Approvals Inbox</h3>
                <p className="text-slate-500 text-xs mt-1">Review pending quotations and authorize purchase orders.</p>
              </div>

              {/* Pending Quotations List */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-3 px-4 text-slate-500 font-black uppercase tracking-wider text-[10px]">RFQ Title</th>
                        <th className="py-3 px-4 text-slate-500 font-black uppercase tracking-wider text-[10px]">Vendor</th>
                        <th className="py-3 px-4 text-slate-500 font-black uppercase tracking-wider text-[10px]">Total Amount</th>
                        <th className="py-3 px-4 text-slate-500 font-black uppercase tracking-wider text-[10px]">Notes</th>
                        <th className="py-3 px-4 text-slate-500 font-black uppercase tracking-wider text-[10px]">Date</th>
                        <th className="py-3 px-4 text-right text-slate-500 font-black uppercase tracking-wider text-[10px]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quotations && quotations.filter(q => q.status === 'PENDING').length > 0 ? (
                        quotations.filter(q => q.status === 'PENDING').map((q, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-4 px-4 font-bold text-slate-700">{q.rfqId?.title || 'Unknown RFQ'}</td>
                            <td className="py-4 px-4 text-slate-600">{q.vendorId?.name || 'Unknown Vendor'}</td>
                            <td className="py-4 px-4 font-mono font-bold text-blue-600">₹{q.totalAmount?.toFixed(2)}</td>
                            <td className="py-4 px-4 text-slate-500 max-w-[200px] truncate">{q.deliveryNotes || '-'}</td>
                            <td className="py-4 px-4 text-slate-500 font-mono">{new Date(q.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-4 text-right">
                              {user?.role === 'MANAGER' || user?.role === 'COMPANY' ? (
                                <button 
                                  onClick={() => handleApproveQuotation(q._id)}
                                  disabled={approvingQuote === q._id}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                                >
                                  {approvingQuote === q._id ? 'Approving...' : 'Approve'}
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manager Access Required</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500 font-mono">No pending quotations waiting for approval.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: PURCHASE ORDERS */}
          {/* ======================================================== */}
          {currentView === 'pos' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Purchase Orders</h3>
                <p className="text-slate-500 text-xs mt-1">Convert approved quotations into official procurement documents</p>
              </div>

              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/30 flex justify-between items-center">
                  <span className="font-bold text-xs uppercase text-slate-500 font-mono">Issued Purchase Orders</span>
                  <span className="text-[10px] text-slate-500 font-mono">{pos ? pos.length : 0} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[9px] text-slate-500 font-black uppercase tracking-wider bg-slate-50/20">
                        <th className="py-3 px-5">PO Number</th>
                        <th className="py-3 px-5">Vendor</th>
                        <th className="py-3 px-5">Amount</th>
                        <th className="py-3 px-5">Date</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {pos && pos.length > 0 ? pos.map((po, i) => (
                          <tr key={i} className="hover:bg-slate-100/30 transition-colors">
                            <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{po.poNumber}</td>
                            <td className="py-3.5 px-5 text-slate-600">{po.vendorId?.name || 'Unknown'}</td>
                            <td className="py-3.5 px-5 font-mono text-slate-600">₹{po.grandTotal?.toFixed(2)}</td>
                            <td className="py-3.5 px-5 text-slate-500 font-mono">{new Date(po.createdAt).toLocaleDateString()}</td>
                            <td className="py-3.5 px-5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                po.status === 'ISSUED' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              }`}>
                                {po.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right flex items-center justify-end gap-2">
                              {!invoices?.some(inv => inv.poId === po._id) ? (
                                <button
                                  onClick={() => handleGenerateInvoice(po._id)}
                                  disabled={generatingInvoice === po._id}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-[9px] font-bold uppercase tracking-wider transition-colors"
                                >
                                  {generatingInvoice === po._id ? 'Generating...' : 'Generate Invoice'}
                                </button>
                              ) : (
                                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wider">
                                  Invoiced
                                </span>
                              )}
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="6" className="py-4 text-center text-slate-500">No POs found</td></tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: INVOICES */}
          {/* ======================================================== */}
          {currentView === 'invoices' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Commercial Invoices</h3>
                <p className="text-slate-500 text-xs mt-1">Manage vendor payments and download invoice PDFs</p>
              </div>

              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/30 flex justify-between items-center">
                  <span className="font-bold text-xs uppercase text-slate-500 font-mono">Invoice Ledger</span>
                  <span className="text-[10px] text-slate-500 font-mono">{invoices ? invoices.length : 0} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[9px] text-slate-500 font-black uppercase tracking-wider bg-slate-50/20">
                        <th className="py-3 px-5">Invoice Number</th>
                        <th className="py-3 px-5">Amount</th>
                        <th className="py-3 px-5">Due Date</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {invoices && invoices.length > 0 ? invoices.map((inv, i) => (
                          <tr key={i} className="hover:bg-slate-100/30 transition-colors">
                            <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{inv.invoiceNumber}</td>
                            <td className="py-3.5 px-5 font-mono text-slate-600">₹{inv.amount?.toFixed(2)}</td>
                            <td className="py-3.5 px-5 text-slate-500 font-mono">{new Date(inv.dueDate).toLocaleDateString()}</td>
                            <td className="py-3.5 px-5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                inv.status === 'PAID' 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                  : 'bg-rose-50 text-rose-600 border-rose-200'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right flex gap-2 justify-end">
                              <button 
                                onClick={() => handleDownloadPDF(`invoice-pdf-${inv._id}`, inv.invoiceNumber)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded text-[9px] font-bold uppercase tracking-wider transition-colors"
                              >
                                Download PDF
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="5" className="py-4 text-center text-slate-500">No invoices found</td></tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* OFF-SCREEN INVOICE TEMPLATES FOR PDF GENERATION */}
              <div className="absolute left-[-9999px] top-[-9999px] opacity-0 pointer-events-none">
                {invoices && invoices.map((inv) => {
                  const relatedPO = pos?.find(p => p._id === inv.poId);
                  return (
                    <div id={`invoice-pdf-${inv._id}`} key={`pdf-${inv._id}`} className="p-10 w-[800px] bg-[#ffffff] text-[#0f172a] border border-[#e2e8f0]">
                      <div className="flex justify-between items-start border-b-2 border-[#2563eb] pb-6 mb-6">
                        <div>
                          <h1 className="text-4xl font-black tracking-tight text-[#2563eb] uppercase">INVOICE</h1>
                          <p className="text-sm font-bold text-[#64748b] mt-1">{inv.invoiceNumber}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-bold">{company?.name || 'Your Company'}</p>
                          <p className="text-[#64748b]">{company?.country || 'Global'}</p>
                          <p className="text-[#64748b] mt-2 font-mono">Date: {new Date(inv.createdAt).toLocaleDateString()}</p>
                          <p className="text-[#64748b] font-mono">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex justify-between mb-8">
                        <div className="w-1/2">
                          <h3 className="text-xs font-black uppercase text-[#94a3b8] mb-2">Billed To:</h3>
                          <p className="font-bold text-lg">{company?.name}</p>
                          <p className="text-[#64748b] text-sm">PO Number: {relatedPO?.poNumber}</p>
                        </div>
                        <div className="w-1/2 text-right">
                          <h3 className="text-xs font-black uppercase text-[#94a3b8] mb-2">Pay To Vendor:</h3>
                          <p className="font-bold text-lg">{inv.vendorId?.name}</p>
                          <p className="text-[#64748b] text-sm">{inv.vendorId?.email}</p>
                          <p className="text-[#64748b] text-sm">{inv.vendorId?.contactNo}</p>
                        </div>
                      </div>

                      <table className="w-full text-left mb-8 border-collapse">
                        <thead>
                          <tr className="text-xs font-black uppercase bg-[#f1f5f9] text-[#475569]">
                            <th className="p-3 border border-[#e2e8f0]">Description</th>
                            <th className="p-3 border border-[#e2e8f0] text-center">Qty</th>
                            <th className="p-3 border border-[#e2e8f0] text-right">Unit Price</th>
                            <th className="p-3 border border-[#e2e8f0] text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatedPO?.items?.map((item, idx) => (
                            <tr key={idx} className="border-b border-[#e2e8f0] text-sm">
                              <td className="p-3">{item.productName}</td>
                              <td className="p-3 text-center">{item.quantity} {item.unit}</td>
                              <td className="p-3 text-right font-mono">₹{item.unitPrice?.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono font-bold">₹{item.total?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="flex justify-end mb-12">
                        <div className="w-1/2">
                          <div className="flex justify-between p-2 border-b border-[#e2e8f0] text-sm">
                            <span className="font-bold text-[#64748b]">Subtotal:</span>
                            <span className="font-mono">₹{relatedPO?.subTotal?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between p-2 border-b border-[#e2e8f0] text-sm">
                            <span className="font-bold text-[#64748b]">Tax ({relatedPO?.taxPercent}% GST):</span>
                            <span className="font-mono">₹{relatedPO?.taxAmount?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between p-3 mt-2 rounded bg-[#eff6ff] text-[#1e3a8a] border-2 border-[#bfdbfe]">
                            <span className="font-black uppercase tracking-widest">Grand Total:</span>
                            <span className="font-black font-mono text-xl">₹{inv.amount?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-[#e2e8f0] pt-6 text-center text-xs text-[#64748b]">
                        <p>Payment is due within 30 days. Thank you for your business.</p>
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: REPORTS */}
          {/* ======================================================== */}
          {(currentView === 'reports' || currentView === 'activity') && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
              {/* Animated Icon Cluster */}
              <div className="relative flex items-center justify-center w-32 h-32">
                {/* Outer spinning dashed ring */}
                <div className="absolute inset-0 border-[3px] border-blue-200 border-dashed rounded-full animate-spin [animation-duration:4s]" />
                {/* Inner spinning dotted ring */}
                <div className="absolute inset-3 border-[3px] border-blue-400 border-dotted rounded-full animate-spin [animation-duration:6s] [animation-direction:reverse]" />
                {/* Center glowing diamond */}
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl rotate-45 animate-pulse flex items-center justify-center shadow-2xl shadow-blue-500/50">
                  <div className="w-6 h-6 bg-white/30 rounded-md" />
                </div>
              </div>

              {/* Text Content */}
              <div className="text-center space-y-3">
                <h3 className="text-4xl font-black tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    Feature Coming Soon
                  </span>
                </h3>
                <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
                  We are actively building this module. <br/> Advanced analytics and real-time audit logs will be available shortly!
                </p>
              </div>

              {/* Decorative progress bar */}
              <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
                <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full w-24 animate-[bounce_1.5s_infinite]" style={{ animationDirection: 'alternate' }} />
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* ADD VENDOR MODAL POPUP */}
      {/* ======================================================== */}
      {showAddVendor && (
        <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowAddVendor(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
            <div>
              <h4 className="text-base font-black text-slate-900 uppercase tracking-wider">Register Supplier Profile</h4>
              <p className="text-slate-500 text-[11px] mt-0.5">Add a new vendor record to assign in RFQs</p>
            </div>

            {/* Success & Error feedbacks */}
            {addVendorSuccess && (
              <div className="bg-blue-50/80 border border-blue-200 text-blue-600 p-3 rounded text-xs text-center font-mono">
                ✓ Vendor Registered Successfully!
              </div>
            )}
            {addVendorError && (
              <div className="bg-rose-50/80 border border-rose-200 text-rose-600 p-3 rounded text-xs text-center font-mono">
                ⚠ {addVendorError}
              </div>
            )}

            <form onSubmit={handleAddVendorSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider">Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Alpha Supplies Pvt Ltd"
                  value={newVendorData.name}
                  onChange={(e) => setNewVendorData({ ...newVendorData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="supplier@alpha.com"
                  value={newVendorData.email}
                  onChange={(e) => setNewVendorData({ ...newVendorData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider">Contact Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210"
                    value={newVendorData.contactNo}
                    onChange={(e) => setNewVendorData({ ...newVendorData, contactNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider">Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="India"
                    value={newVendorData.country}
                    onChange={(e) => setNewVendorData({ ...newVendorData, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider">Supplier Description</label>
                <textarea
                  rows="2"
                  placeholder="Details of categories, products, delivery capabilities..."
                  value={newVendorData.description}
                  onChange={(e) => setNewVendorData({ ...newVendorData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded uppercase text-xs tracking-wider transition-colors cursor-pointer"
                >
                  Register Vendor
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddVendor(false)}
                  className="px-4 py-2.5 border border-slate-850 hover:bg-slate-100 text-slate-500 rounded font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CompanyPage;
