import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../auth/auth.slice';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BridgeLoader from '../../components/BridgeLoader';
import BridgeIcon from '../../assets/Bridge.png';

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

  // Mock data for Quotations Comparison, Approvals, POs & Invoices to populate secondary views
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

  const [approvalStatus, setApprovalStatus] = useState('In Approval'); // 'Submitted', 'Review', 'Approved', 'PO Generated'
  const [remarks, setRemarks] = useState('');
  const [approvalTimeline, setApprovalTimeline] = useState([
    { role: 'PO', name: 'Nidhi (Procurement Officer)', action: 'Submitted & Approved', date: 'May 20, 2026', status: 'completed' },
    { role: 'MANAGER', name: 'Priya Shah (Finance Manager)', action: 'Approved & Signed', date: 'May 21, 2026', status: 'completed' },
    { role: 'COMPANY', name: 'Admin Sign-off', action: 'Pending final authorization', date: 'Awaiting', status: 'pending' }
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

  // RFQ Creation logic (Wizard Step 3 finalization)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Initialising VendorBridge Console...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-mono">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 bg-rose-950/40 border border-rose-800 rounded-full flex items-center justify-center mx-auto text-rose-500">
            ⚠
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider">Console Error</h2>
          <p className="text-slate-400 text-xs">{error}</p>
          <div className="flex gap-3 justify-center pt-2">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all cursor-pointer"
            >
              Retry
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded text-xs font-bold transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { company, rfqs, vendors } = dashboardData || {};

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-950 selection:text-emerald-400">
      
      {/* ======================================================== */}
      {/* STICKY LEFT SIDEBAR (Screen 3, 4, 5 Mockup style) */}
      {/* ======================================================== */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20">
        <div className="flex flex-col">
          
          {/* Logo Brand Header */}
          <div className="h-16 border-b border-slate-800 px-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-slate-900 font-black text-base">
              VB
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white">
                Vendor<span className="text-emerald-500">Bridge</span>
              </h1>
              <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold -mt-0.5">
                ERP Management
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '⧉' },
              { id: 'vendors', label: 'Vendors', icon: '👥' },
              { id: 'rfqs', label: 'RFQ\'s', icon: '📄' },
              { id: 'quotations', label: 'Quotations', icon: '📊' },
              { id: 'approvals', label: 'Approvals', icon: '👔' },
              { id: 'pos', label: 'Purchase orders', icon: '✨' },
              { id: 'invoices', label: 'Invoices', icon: '🏛️' },
              { id: 'reports', label: 'Reports', icon: '📈' },
              { id: 'activity', label: 'Activity', icon: '⌛' }
            ].map((link) => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setCurrentView(link.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-950/60 text-emerald-400 border-l-4 border-emerald-500' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-sm font-mono">{link.icon}</span>
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 text-xs flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white uppercase">
              {company?.name?.charAt(0)}
            </div>
            <div className="truncate">
              <p className="font-bold text-white truncate">{company?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{company?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-1.5 mt-1 border border-slate-800 hover:border-rose-900/50 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 rounded font-bold uppercase text-[9px] tracking-wider transition-colors cursor-pointer"
          >
            Sign Out Console
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* RIGHT MAIN VIEW PANEL */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-900 px-8 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 font-mono">
            Company Terminal: <span className="text-white">{company?.name}</span>
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
              Country: {company?.country || 'Global'}
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
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
                <h3 className="text-2xl font-black text-white">Dashboard</h3>
                <p className="text-slate-400 text-xs mt-1">Welcome back, Procurement Administrator — Today's Overview</p>
              </div>

              {/* KPI metrics row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-2">
                  <span className="text-[10px] text-slate-400 font-black block uppercase tracking-wider">Active RFQ's</span>
                  <span className="text-3xl font-black font-mono text-white">{rfqs?.filter(r=>r.status==='ACTIVE').length || 0}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-2">
                  <span className="text-[10px] text-slate-400 font-black block uppercase tracking-wider">Pending Approvals</span>
                  <span className="text-3xl font-black font-mono text-emerald-500">5</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-2 relative group cursor-help">
                  <span className="text-[10px] text-slate-400 font-black block uppercase tracking-wider">Total spend</span>
                  <span className="text-3xl font-black font-mono text-white">2.3L</span>
                  <div className="absolute top-2 right-2 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[8px] font-bold px-1.5 rounded uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    Hovered: Nidhi
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-2">
                  <span className="text-[10px] text-slate-400 font-black block uppercase tracking-wider">Monthly savings</span>
                  <span className="text-3xl font-black font-mono text-white">3</span>
                </div>
              </div>

              {/* Table & Spending Chart Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Recent Purchase Orders Table */}
                <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
                    Recent Purchase Orders
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[9px] text-slate-500 font-black uppercase tracking-wider">
                          <th className="py-2.5">PO #</th>
                          <th className="py-2.5">Vendor</th>
                          <th className="py-2.5">Amount</th>
                          <th className="py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {mockPOs.map((po, i) => (
                          <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 font-mono font-bold text-slate-300">{po.poNumber}</td>
                            <td className="py-3 text-slate-400">{po.vendor}</td>
                            <td className="py-3 font-mono text-slate-300">{po.amount}</td>
                            <td className="py-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                po.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-500 border border-amber-800'
                              }`}>
                                {po.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Spending Trends Widget */}
                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
                    Spending Trends (Last 4 Months)
                  </h4>
                  
                  {/* Custom SVG/CSS Bar Graph representation */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-end justify-between h-32 px-4 border-b border-slate-800">
                      {[
                        { month: 'Mar', val: '40%', amount: '₹1.2L' },
                        { month: 'Apr', val: '75%', amount: '₹2.3L' },
                        { month: 'May', val: '60%', amount: '₹1.8L' },
                        { month: 'Jun', val: '90%', amount: '₹2.7L' }
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 w-10 group relative">
                          <span className="text-[8px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 bg-slate-800 px-1 border border-slate-700 rounded whitespace-nowrap z-10">
                            {item.amount}
                          </span>
                          <div 
                            style={{ height: item.val }} 
                            className="w-full bg-emerald-600/80 group-hover:bg-emerald-500 rounded-t transition-all duration-300"
                          />
                          <span className="text-[9px] font-bold text-slate-500 mt-1">{item.month}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between px-2 font-mono">
                      <span>Min: 1.2L</span>
                      <span>Max: 2.7L</span>
                    </div>
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
                  className="px-5 py-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-900/10 cursor-pointer"
                >
                  Create RFQ's
                </button>
                <button 
                  onClick={() => setShowAddVendor(true)}
                  className="px-5 py-2.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Add Vendor
                </button>
                <button 
                  onClick={() => setCurrentView('invoices')}
                  className="px-5 py-2.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
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
                  <h3 className="text-2xl font-black text-white">Vendors</h3>
                  <p className="text-slate-400 text-xs mt-1">Manage supplier profiles and registrations</p>
                </div>
                <button
                  onClick={() => setShowAddVendor(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded transition-colors cursor-pointer"
                >
                  + Add Vendor
                </button>
              </div>

              {/* Search input */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded space-y-4">
                <input
                  type="text"
                  placeholder="Search bar — search by name, gst number, category..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-mono"
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
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vendors List Table */}
              <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[9px] text-slate-500 font-black uppercase tracking-wider bg-slate-950/30">
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
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-5">
                              <span className="font-bold text-slate-200 block">{vendor.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono block">{vendor.email}</span>
                            </td>
                            <td className="py-4 px-5 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                              {vendor.category || 'IT Services'}
                            </td>
                            <td className="py-4 px-5 text-slate-400 font-mono font-semibold">
                              {vendor.gstNumber || '27AAACG1234F1Z0'}
                            </td>
                            <td className="py-4 px-5 text-slate-400 font-mono">
                              {vendor.contactNo || 'N/A'}
                            </td>
                            <td className="py-4 px-5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                vendor.status === 'ACTIVE' 
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}>
                                {vendor.status === 'ACTIVE' ? 'Active' : 'Blocked'}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <button className="px-2.5 py-1 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer">
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
                  <h3 className="text-2xl font-black text-white">Create RFQ's</h3>
                  <p className="text-slate-400 text-xs mt-1">new request for quotation</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRfqStep(1)}
                    className={`px-4 py-2 rounded text-xs font-black uppercase tracking-wider cursor-pointer ${
                      rfqStep === 1 ? 'bg-slate-800 text-white' : 'bg-slate-900/40 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    Creation Wizard
                  </button>
                  <button
                    onClick={() => setRfqStep(0)} // Special status: List RFQs
                    className={`px-4 py-2 rounded text-xs font-black uppercase tracking-wider cursor-pointer ${
                      rfqStep === 0 ? 'bg-slate-800 text-white' : 'bg-slate-900/40 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    View RFQ List
                  </button>
                </div>
              </div>

              {/* STEP 0: RFQ LIST VIEW */}
              {rfqStep === 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/30 flex justify-between items-center">
                    <span className="font-bold text-xs uppercase text-slate-400">Company RFQ Records</span>
                    <span className="text-[10px] text-slate-500 font-mono">{rfqs?.length || 0} Open RFQs</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[9px] text-slate-500 font-black uppercase tracking-wider bg-slate-950/20">
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
                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3.5 px-5">
                                <span className="font-bold text-slate-200 block">{rfq.title}</span>
                                <span className="text-[10px] text-slate-500 max-w-xs truncate block">{rfq.description || 'No Description'}</span>
                              </td>
                              <td className="py-3.5 px-5 text-slate-400 font-semibold">{rfq.category || 'Furniture'}</td>
                              <td className="py-3.5 px-5">
                                <span className="text-slate-300 block">{rfq.createdBy?.name || 'PO'}</span>
                                <span className="text-[9px] text-slate-500 block font-mono">{rfq.createdBy?.email}</span>
                              </td>
                              <td className="py-3.5 px-5 text-slate-400 font-mono">
                                {new Date(rfq.deadline).toLocaleDateString()}
                              </td>
                              <td className="py-3.5 px-5 text-slate-400 font-mono font-bold">
                                {rfq.assignedVendors?.length || 0} Vendors
                              </td>
                              <td className="py-3.5 px-5 text-right">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                  rfq.status === 'ACTIVE' 
                                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                                    : 'bg-amber-950 text-amber-500 border-amber-800'
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
                <div className="bg-slate-900 border border-slate-800 rounded p-6 space-y-6">
                  
                  {/* Step Indicators */}
                  <div className="flex justify-between items-center max-w-lg mx-auto relative">
                    <div className="absolute left-0 right-0 h-0.5 bg-slate-800 top-1/2 -translate-y-1/2 z-0" />
                    {[
                      { num: 1, label: 'RFQ Details' },
                      { num: 2, label: 'Add Items' },
                      { num: 3, label: 'Assign Vendors' }
                    ].map(step => (
                      <div key={step.num} className="flex flex-col items-center gap-1.5 relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                          rfqStep === step.num
                            ? 'bg-emerald-600 text-slate-950 border-emerald-500 font-black'
                            : rfqStep > step.num
                            ? 'bg-slate-800 text-emerald-400 border-emerald-600'
                            : 'bg-slate-950 text-slate-600 border-slate-800'
                        }`}>
                          {step.num}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          rfqStep === step.num ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Feedback Messages */}
                  {rfqSuccessMsg && (
                    <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-400 p-4 rounded text-xs text-center font-mono">
                      ✓ {rfqSuccessMsg}
                    </div>
                  )}
                  {rfqErrorMsg && (
                    <div className="bg-rose-950/80 border border-rose-800 text-rose-400 p-4 rounded text-xs text-center font-mono">
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
                            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">RFQ Title *</label>
                            <input
                              type="text"
                              value={rfqTitle}
                              onChange={(e) => setRfqTitle(e.target.value)}
                              placeholder="e.g., Office Furniture Procurement Q2"
                              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Category</label>
                              <select
                                value={rfqCategory}
                                onChange={(e) => setRfqCategory(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-600"
                              >
                                <option value="Furniture">Furniture</option>
                                <option value="IT Hardware">IT Hardware</option>
                                <option value="Office Supplies">Office Supplies</option>
                                <option value="Logistics">Logistics</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Deadline *</label>
                              <input
                                type="date"
                                value={rfqDeadline}
                                onChange={(e) => setRfqDeadline(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-600"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Description</label>
                            <textarea
                              rows="4"
                              value={rfqDescription}
                              onChange={(e) => setRfqDescription(e.target.value)}
                              placeholder="Describe the items, specifications, terms and conditions..."
                              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* STEP 2: ADD ITEMS TABLE */}
                      {rfqStep === 2 && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Line Item Specifications</span>
                            <button
                              type="button"
                              onClick={() => setRfqItems([...rfqItems, { productName: '', quantity: 1, unit: 'pcs' }])}
                              className="text-[10px] text-emerald-400 font-bold hover:underline cursor-pointer"
                            >
                              + add line item
                            </button>
                          </div>

                          <div className="space-y-3">
                            {rfqItems.map((item, index) => (
                              <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-950 p-3 rounded border border-slate-800">
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
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
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
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none font-mono"
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
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                                  />
                                </div>
                                <div className="col-span-1 pt-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setRfqItems(rfqItems.filter((_, i) => i !== index))}
                                    className="text-rose-500 font-bold hover:text-rose-400 text-xs cursor-pointer"
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
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider pb-2 border-b border-slate-800">
                            Assign Target Vendors
                          </span>
                          
                          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800 bg-slate-950 p-2 border border-slate-800 rounded">
                            {vendors && vendors.length > 0 ? (
                              vendors.map((v, i) => (
                                <label key={i} className="flex items-center gap-3 p-2.5 hover:bg-slate-900/60 cursor-pointer">
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
                                    className="rounded text-emerald-600 bg-slate-900 border-slate-800 focus:ring-emerald-600"
                                  />
                                  <div className="text-xs">
                                    <span className="font-bold text-slate-200 block">{v.name}</span>
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
                      <div className="flex gap-3 pt-4 border-t border-slate-800">
                        {rfqStep > 1 && (
                          <button
                            type="button"
                            onClick={() => setRfqStep(rfqStep - 1)}
                            className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white rounded text-xs font-bold transition-all cursor-pointer"
                          >
                            Back Step
                          </button>
                        )}
                        {rfqStep < 3 ? (
                          <button
                            type="button"
                            onClick={() => setRfqStep(rfqStep + 1)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black rounded text-xs uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Continue
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleCreateRFQSubmit}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black rounded text-xs uppercase tracking-wider transition-colors cursor-pointer"
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
                              className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded text-xs font-bold cursor-pointer"
                            >
                              Save as Draft
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* RIGHT FILE ATTACHMENT BOX COLUMN */}
                    <div className="lg:col-span-5 space-y-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Attachments</span>
                      
                      <div className="border-2 border-dashed border-slate-800 hover:border-emerald-600/50 bg-slate-950 p-8 rounded-xl text-center space-y-2 cursor-pointer transition-colors group">
                        <span className="text-3xl block filter group-hover:scale-110 transition-transform">☁</span>
                        <p className="text-xs font-bold text-slate-300">Drag & drop files or click to upload</p>
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
                <h3 className="text-2xl font-black text-white">Quotation Comparison</h3>
                <p className="text-slate-400 text-xs mt-1">RFQ: office furniture procurement q2 — 3 quotations received</p>
              </div>

              {/* Quotations Side-by-side table */}
              <div className="bg-slate-900 border border-slate-800 rounded p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="py-3 px-4 text-left text-[10px] text-slate-500 font-black uppercase tracking-wider">Criteria</th>
                        <th className="py-3 px-4 bg-emerald-950/40 border-x border-emerald-900/60 text-emerald-400 font-black uppercase tracking-wider text-[10px]">
                          Infra Supplies (Lowest)
                        </th>
                        <th className="py-3 px-4 text-slate-400 font-black uppercase tracking-wider text-[10px]">TechServ Ltd</th>
                        <th className="py-3 px-4 text-slate-400 font-black uppercase tracking-wider text-[10px]">Office Wood Co</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {mockQuotations.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/10">
                          <td className="py-4 px-4 text-left font-bold text-slate-300">{row.criteria}</td>
                          <td className={`py-4 px-4 bg-emerald-950/30 border-x border-emerald-900/30 font-mono font-bold text-emerald-400 ${
                            row.isPrice ? 'text-sm' : ''
                          }`}>
                            {row.infra}
                          </td>
                          <td className={`py-4 px-4 text-slate-400 font-mono ${row.isPrice ? 'font-bold' : ''}`}>{row.techserv}</td>
                          <td className={`py-4 px-4 text-slate-400 font-mono ${row.isPrice ? 'font-bold' : ''}`}>{row.officewood}</td>
                        </tr>
                      ))}
                      
                      {/* Action buttons row */}
                      <tr>
                        <td className="py-4 px-4 text-left"></td>
                        <td className="py-4 px-4 bg-emerald-950/30 border-x border-emerald-900/30">
                          <button
                            onClick={() => {
                              setCurrentView('approvals');
                              setApprovalStatus('In Approval');
                            }}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black rounded uppercase text-[10px] tracking-wider transition-colors cursor-pointer"
                          >
                            Select & Approve
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <button 
                            onClick={() => setCurrentView('approvals')}
                            className="w-full py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded uppercase text-[10px] tracking-wider cursor-pointer"
                          >
                            Select
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <button 
                            onClick={() => setCurrentView('approvals')}
                            className="w-full py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded uppercase text-[10px] tracking-wider cursor-pointer"
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Note message */}
                <p className="text-[10px] text-slate-500 font-mono italic mt-4 text-center">
                  * Note: choosing lowest price or selecting vendor initiates the approval workflow.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: APPROVALS (Screen 7 approval workflow style) */}
          {/* ======================================================== */}
          {currentView === 'approvals' && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h3 className="text-2xl font-black text-white">Approval Workflow</h3>
                <p className="text-slate-400 text-xs mt-1">RFQ: office furniture Q2 - Vendor: Infra Supplies - ₹1,85,400</p>
              </div>

              {/* Progress Flow Stepper */}
              <div className="bg-slate-900 border border-slate-800 rounded p-6 space-y-6">
                
                {/* Horizontal progress steps */}
                <div className="flex justify-between items-center max-w-xl mx-auto relative">
                  <div className="absolute left-0 right-0 h-0.5 bg-slate-800 top-1/2 -translate-y-1/2 z-0" />
                  {[
                    { step: 1, label: 'Submitted', done: true },
                    { step: 2, label: 'PO Review', done: true },
                    { step: 3, label: 'L3 Approval', active: true },
                    { step: 4, label: 'Generate PO', done: false }
                  ].map(item => (
                    <div key={item.step} className="flex flex-col items-center gap-1.5 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                        item.active
                          ? 'bg-emerald-600 text-slate-950 border-emerald-500 font-black'
                          : item.done
                          ? 'bg-slate-800 text-emerald-400 border-emerald-600'
                          : 'bg-slate-950 text-slate-600 border-slate-800'
                      }`}>
                        {item.step}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        item.active ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Split Details & Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                  
                  {/* Left Column: Sign-off checklist */}
                  <div className="space-y-4 border-r border-slate-800 pr-6">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Approval Chain status</h4>
                    <div className="space-y-3">
                      {approvalTimeline.map((node, i) => (
                        <div key={i} className="flex gap-3.5 items-start">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5 ${
                            node.status === 'completed' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-slate-950 text-slate-600 border border-slate-800'
                          }`}>
                            {node.status === 'completed' ? '✓' : '⌛'}
                          </div>
                          <div className="text-xs">
                            <p className="font-bold text-slate-200">{node.name}</p>
                            <p className="text-[10px] text-slate-500">{node.action} | {node.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Sign-off form */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Approve Remarks</h4>
                    
                    <div className="space-y-3">
                      <textarea
                        rows="3"
                        placeholder="Add your comments, or conditions..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-none"
                      />

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            // Update timeline state to simulate admin signature
                            const updated = [...approvalTimeline];
                            updated[2] = { role: 'COMPANY', name: 'Admin Sign-off', action: 'Approved & Finalized', date: 'Just now', status: 'completed' };
                            setApprovalTimeline(updated);
                            setApprovalStatus('Approved');
                            alert('Workflow Approved! Ready to dispatch Purchase Order.');
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black rounded text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            alert('Workflow Rejected with comments.');
                          }}
                          className="px-4 py-2 border border-slate-800 hover:bg-rose-950/25 hover:border-rose-950 text-rose-500 rounded text-xs font-bold transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Quotations Summary box */}
                    <div className="bg-slate-950 p-4 border border-slate-800 rounded text-xs space-y-2">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Quotation Summary</span>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vendor</span>
                        <span className="font-bold text-slate-200">Infra Supplies, PVT LTD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total</span>
                        <span className="font-mono font-bold text-slate-200">₹1,85,400</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Delivery</span>
                        <span className="font-mono text-slate-200">10 days</span>
                      </div>
                    </div>

                  </div>

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
                <h3 className="text-2xl font-black text-white">Purchase Orders</h3>
                <p className="text-slate-400 text-xs mt-1">Convert approved quotations into official procurement documents</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/30 flex justify-between items-center">
                  <span className="font-bold text-xs uppercase text-slate-400 font-mono">Issued Purchase Orders</span>
                  <span className="text-[10px] text-slate-500 font-mono">{mockPOs.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[9px] text-slate-500 font-black uppercase tracking-wider bg-slate-950/20">
                        <th className="py-3 px-5">PO Number</th>
                        <th className="py-3 px-5">Vendor</th>
                        <th className="py-3 px-5">Amount</th>
                        <th className="py-3 px-5">Release Date</th>
                        <th className="py-3 px-5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {mockPOs.map((po, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-emerald-400">{po.poNumber}</td>
                          <td className="py-3.5 px-5 text-slate-300 font-bold">{po.vendor}</td>
                          <td className="py-3.5 px-5 text-slate-400 font-mono font-semibold">{po.amount}</td>
                          <td className="py-3.5 px-5 text-slate-500 font-mono">{po.date}</td>
                          <td className="py-3.5 px-5 text-right">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              po.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-500 border border-amber-800'
                            }`}>
                              {po.status}
                            </span>
                          </td>
                        </tr>
                      ))}
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
                <h3 className="text-2xl font-black text-white">Invoices</h3>
                <p className="text-slate-400 text-xs mt-1">Audit billing slips matching released purchase orders</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/30 flex justify-between items-center">
                  <span className="font-bold text-xs uppercase text-slate-400 font-mono">Invoice Ledger Match</span>
                  <span className="text-[10px] text-slate-500 font-mono">{mockInvoices.length} entries</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[9px] text-slate-500 font-black uppercase tracking-wider bg-slate-950/20">
                        <th className="py-3 px-5">Invoice Number</th>
                        <th className="py-3 px-5">Matching PO</th>
                        <th className="py-3 px-5">Vendor Name</th>
                        <th className="py-3 px-5">Amount Due</th>
                        <th className="py-3 px-5 text-right">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {mockInvoices.map((inv, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-slate-300">{inv.invNumber}</td>
                          <td className="py-3.5 px-5 font-mono text-slate-400">{inv.poNumber}</td>
                          <td className="py-3.5 px-5 text-slate-300">{inv.vendor}</td>
                          <td className="py-3.5 px-5 text-slate-400 font-mono font-semibold">{inv.amount}</td>
                          <td className="py-3.5 px-5 text-right">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              inv.status === 'Paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: REPORTS */}
          {/* ======================================================== */}
          {currentView === 'reports' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-white">Reports & Analytics</h3>
                <p className="text-slate-400 text-xs mt-1">Provide procurement insights, spend summaries, and trends</p>
              </div>

              {/* Analytics panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Spending Summary */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
                    Spending Summaries (by Category)
                  </h4>
                  
                  <div className="space-y-3 pt-2">
                    {[
                      { name: 'Office Furniture', amount: '₹1.85L', pct: '70%', color: 'bg-emerald-500' },
                      { name: 'IT Infrastructure', amount: '₹0.50L', pct: '20%', color: 'bg-blue-500' },
                      { name: 'Office Supplies', amount: '₹0.20L', pct: '10%', color: 'bg-indigo-500' }
                    ].map((row, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300">{row.name}</span>
                          <span className="text-slate-400">{row.amount} ({row.pct})</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                          <div style={{ width: row.pct }} className={`h-full ${row.color}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vendor Grading Analysis */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
                    Vendor Performance Matrix
                  </h4>
                  
                  <div className="space-y-3 pt-2">
                    {[
                      { name: 'Infra Supplies Pvt Ltd', grade: '4.6 / 5', label: 'EXCELLENT', color: 'text-emerald-400' },
                      { name: 'TechServ Ltd', grade: '4.2 / 5', label: 'GOOD', color: 'text-blue-400' },
                      { name: 'Office Wood Co', grade: '4.8 / 5', label: 'EXCELLENT', color: 'text-emerald-400' }
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-slate-950 rounded border border-slate-850">
                        <span className="font-bold text-slate-300">{row.name}</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-white block">{row.grade}</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider ${row.color}`}>{row.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: ACTIVITY & STAFF (Auditing & Team) */}
          {/* ======================================================== */}
          {currentView === 'activity' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Activity Audit Timeline */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded p-6 space-y-6">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
                    Activity Logs & Audit Timeline
                  </h4>
                </div>

                <div className="space-y-6 pt-2">
                  {activityLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-4 items-start relative">
                      {idx < activityLogs.length - 1 && (
                        <div className="absolute left-3 top-5 bottom-[-24px] w-0.5 bg-slate-800" />
                      )}
                      <div className="w-6.5 h-6.5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] text-emerald-400 font-bold shrink-0 mt-0.5">
                        {log.actor.charAt(0)}
                      </div>
                      <div className="text-xs space-y-0.5">
                        <p className="text-slate-300 font-semibold">{log.message}</p>
                        <span className="text-[10px] text-slate-500 font-mono block">{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Corporate Staff List (Manager & POs) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Manager */}
                <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
                    Company Manager
                  </h4>
                  {company?.manager ? (
                    <div className="text-xs space-y-3">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Full Name</span>
                        <p className="font-bold text-slate-200 text-sm">{company.manager.name}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Email Address</span>
                        <p className="font-mono text-slate-400 font-semibold break-all">{company.manager.email}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Contact Number</span>
                        <p className="font-semibold text-slate-300">{company.manager.contactNo || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-4">No Appointed Manager.</p>
                  )}
                </div>

                {/* PO List */}
                <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
                    Purchase Officers (PO)
                  </h4>
                  {company?.PO && company.PO.length > 0 ? (
                    <div className="divide-y divide-slate-800 text-xs">
                      {company.PO.map((po, i) => (
                        <div key={i} className="py-3 first:pt-0 last:pb-0 space-y-1">
                          <p className="font-bold text-slate-200">{po.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{po.email}</p>
                          <p className="text-[10px] text-slate-500">Contact: {po.contactNo || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-4">No Purchase Officers linked.</p>
                  )}
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* ADD VENDOR MODAL POPUP */}
      {/* ======================================================== */}
      {showAddVendor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowAddVendor(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
            <div>
              <h4 className="text-base font-black text-white uppercase tracking-wider">Register Supplier Profile</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Add a new vendor record to assign in RFQs</p>
            </div>

            {/* Success & Error feedbacks */}
            {addVendorSuccess && (
              <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-400 p-3 rounded text-xs text-center font-mono">
                ✓ Vendor Registered Successfully!
              </div>
            )}
            {addVendorError && (
              <div className="bg-rose-950/80 border border-rose-800 text-rose-400 p-3 rounded text-xs text-center font-mono">
                ⚠ {addVendorError}
              </div>
            )}

            <form onSubmit={handleAddVendorSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Alpha Supplies Pvt Ltd"
                  value={newVendorData.name}
                  onChange={(e) => setNewVendorData({ ...newVendorData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="supplier@alpha.com"
                  value={newVendorData.email}
                  onChange={(e) => setNewVendorData({ ...newVendorData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Contact Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210"
                    value={newVendorData.contactNo}
                    onChange={(e) => setNewVendorData({ ...newVendorData, contactNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="India"
                    value={newVendorData.country}
                    onChange={(e) => setNewVendorData({ ...newVendorData, country: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Supplier Description</label>
                <textarea
                  rows="2"
                  placeholder="Details of categories, products, delivery capabilities..."
                  value={newVendorData.description}
                  onChange={(e) => setNewVendorData({ ...newVendorData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black rounded uppercase text-xs tracking-wider transition-colors cursor-pointer"
                >
                  Register Vendor
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddVendor(false)}
                  className="px-4 py-2.5 border border-slate-850 hover:bg-slate-800 text-slate-400 rounded font-bold transition-all cursor-pointer"
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
