import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser } from '../auth/auth.slice';
import {
  submitRFQ,
  saveDraftRFQ,
  searchVendors,
  resetRFQ,
  clearRFQError,
  clearVendorResults,
} from './rfq.slice';
import BridgeLoader from '../../components/BridgeLoader';
import BridgeIcon from '../../assets/Bridge.png';

/* ─── Sidebar nav items ─────────────────────────────────────────── */
const NAV = [
  { label: 'Dashboard',       path: '/company',   icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { label: "RFQ's",           path: '/rfq/create',icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', active: true },
  { label: 'Quotations',      path: '#',          icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Approvals',       path: '#',          icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Purchase Orders', path: '#',          icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { label: 'Invoices',        path: '#',          icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Reports',         path: '#',          icon: 'M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { label: 'Vendors',         path: '#',          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { label: 'Activity',        path: '#',          icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

const CATEGORIES = [
  'Furniture', 'Electronics', 'IT Equipment', 'Office Supplies',
  'Machinery', 'Raw Materials', 'Packaging', 'Services', 'Software', 'Other',
];

const UNITS = ['NOS', 'KG', 'MTR', 'LTR', 'BOX', 'SET', 'PCS', 'TON', 'SQM', 'HRS'];

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function CreateRFQPage() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { user }   = useSelector((s) => s.auth);
  const { submitLoading, draftLoading, success, draftSaved, error,
          vendorResults, vendorSearching } = useSelector((s) => s.rfq);

  /* ── Wizard step (1-based for display) ────────── */
  const [step, setStep] = useState(1);

  /* ── Step 1 fields ──────────────────────────────── */
  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState('');
  const [deadline,    setDeadline]    = useState('');
  const [description, setDescription] = useState('');

  /* ── Step 2 – line items ─────────────────────────── */
  const [items, setItems] = useState([
    { item: '', qty: '', unit: 'NOS' },
  ]);

  /* ── Step 2 – vendors ────────────────────────────── */
  const [vendorQuery,    setVendorQuery]    = useState('');
  const [assignedVendors, setAssignedVendors] = useState([]);
  const vendorRef = useRef(null);
  const searchTimer = useRef(null);

  /* ── Step 3 – attachments (UI only) ─────────────── */
  const [files,     setFiles]     = useState([]);
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef(null);

  /* ── Local validation error ─────────────────────── */
  const [localError, setLocalError] = useState('');

  /* ── Redirect on success ─────────────────────────── */
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => { dispatch(resetRFQ()); navigate('/company'); }, 2000);
      return () => clearTimeout(t);
    }
  }, [success, dispatch, navigate]);

  useEffect(() => {
    if (draftSaved) {
      const t = setTimeout(() => dispatch(resetRFQ()), 3000);
      return () => clearTimeout(t);
    }
  }, [draftSaved, dispatch]);

  useEffect(() => {
    dispatch(resetRFQ());
  }, [dispatch]);

  /* ── Vendor search (debounced) ───────────────────── */
  const handleVendorSearch = (val) => {
    setVendorQuery(val);
    clearTimeout(searchTimer.current);
    if (val.trim().length < 2) { dispatch(clearVendorResults()); return; }
    searchTimer.current = setTimeout(() => dispatch(searchVendors(val.trim())), 400);
  };

  const addVendor = (v) => {
    if (!assignedVendors.find((x) => x._id === v._id)) {
      setAssignedVendors((prev) => [...prev, v]);
    }
    setVendorQuery('');
    dispatch(clearVendorResults());
  };

  const removeVendor = (id) =>
    setAssignedVendors((prev) => prev.filter((v) => v._id !== id));

  /* ── Line items helpers ──────────────────────────── */
  const updateItem = (idx, field, val) =>
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));

  const addItem    = () => setItems((prev) => [...prev, { item: '', qty: '', unit: 'NOS' }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  /* ── File handling ───────────────────────────────── */
  const handleFiles = (incoming) => {
    const arr = Array.from(incoming);
    setFiles((prev) => [...prev, ...arr]);
  };

  /* ── Step validation ─────────────────────────────── */
  const validateStep1 = () => {
    if (!title.trim())    { setLocalError('RFQ title is required.');      return false; }
    if (!category.trim()) { setLocalError('Category is required.');        return false; }
    if (!deadline)        { setLocalError('Deadline date is required.');   return false; }
    setLocalError(''); return true;
  };

  const validateStep2 = () => {
    const validItems = items.filter((it) => it.item.trim() && it.qty);
    if (validItems.length === 0) { setLocalError('Add at least one line item.'); return false; }
    setLocalError(''); return true;
  };

  /* ── Build payload ───────────────────────────────── */
  const buildPayload = (status) => ({
    title:           title.trim(),
    category:        category.trim(),
    deadline,
    description:     description.trim(),
    items:           items.filter((it) => it.item.trim() && it.qty),
    assignedVendors: assignedVendors.map((v) => v._id),
    status,
  });

  /* ── Submit handlers ─────────────────────────────── */
  const handleSendToVendors = () => {
    dispatch(clearRFQError());
    dispatch(submitRFQ(buildPayload('ACTIVE')));
  };

  const handleSaveDraft = () => {
    dispatch(clearRFQError());
    dispatch(saveDraftRFQ(buildPayload('DRAFT')));
  };

  const handleLogout = () => dispatch(logoutUser());

  /* ─────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased">

      {/* ══ SIDEBAR ══════════════════════════════════════════════════ */}
      <aside className="w-56 shrink-0 bg-slate-900 flex flex-col fixed inset-y-0 left-0 z-30">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-2.5">
          <img src={BridgeIcon} alt="VendorBridge" className="h-9 w-auto object-contain" />
          <div>
            <p className="text-sm font-black text-white tracking-tight leading-tight">
              Vendor<span className="text-blue-400">Bridge</span>
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Console</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.path}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm font-semibold transition-all duration-150 group
                ${n.active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={n.icon} />
              </svg>
              {n.label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-[10px] text-slate-500 font-semibold truncate mb-1">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ══ MAIN ═════════════════════════════════════════════════════ */}
      <div className="ml-56 flex-1 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-8 h-14 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-base font-black text-slate-900">Create RFQ</h1>
            <p className="text-[11px] text-slate-400 font-medium -mt-0.5">New Request for Quotation</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold hidden sm:block">{user?.name || user?.email}</span>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs">
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-8 py-8 max-w-5xl w-full">

          {/* ── Success banner ── */}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">RFQ sent to vendors successfully!</p>
                <p className="text-xs text-emerald-600">Redirecting to dashboard…</p>
              </div>
            </div>
          )}

          {/* ── Draft saved banner ── */}
          {draftSaved && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </div>
              <p className="text-sm font-bold text-blue-800">Draft saved successfully!</p>
            </div>
          )}

          {/* ── Error banner ── */}
          {(error || localError) && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error || localError}
            </div>
          )}

          {/* ══ STEPPER ══════════════════════════════════════════════ */}
          <div className="flex items-center gap-0 mb-8">
            {['Details', 'Items & Vendors', 'Attachments'].map((label, i) => {
              const idx = i + 1;
              const done    = idx < step;
              const current = idx === step;
              return (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300
                      ${done    ? 'bg-blue-600 border-blue-600 text-white'
                      : current ? 'bg-white border-blue-600 text-blue-600 shadow-md shadow-blue-100'
                      :           'bg-white border-slate-200 text-slate-400'}`}
                    >
                      {done
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        : idx}
                    </div>
                    <span className={`text-xs font-bold hidden sm:block ${current ? 'text-blue-600' : done ? 'text-slate-600' : 'text-slate-300'}`}>
                      {label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`h-0.5 flex-1 mx-3 rounded-full transition-all duration-500 ${done ? 'bg-blue-600' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* ══ FORM CARD ════════════════════════════════════════════ */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

            {/* ── STEP 1: DETAILS ─────────────────────────────────── */}
            {step === 1 && (
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">RFQ Details</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Fill in the basic information for this request.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  {/* Title */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      RFQ Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="rfq-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Office Furniture Procurement Q2"
                      className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="rfq-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 outline-none transition appearance-none"
                      >
                        <option value="">Select category…</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Deadline <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="rfq-deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Description</label>
                    <textarea
                      id="rfq-description"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the items, quality requirements, delivery expectations…"
                      className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 outline-none transition resize-none"
                    />
                  </div>
                </div>

                {/* Next */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => { if (validateStep1()) setStep(2); }}
                    className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all active:scale-[0.99] flex items-center gap-2"
                  >
                    Continue to Items
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: LINE ITEMS + VENDORS ────────────────────── */}
            {step === 2 && (
              <div className="p-8 space-y-8">

                {/* Line Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-black text-slate-900">Line Items</h2>
                      <p className="text-xs text-slate-500">Specify each product / material needed.</p>
                    </div>
                    <button
                      onClick={addItem}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Line Item
                    </button>
                  </div>

                  {/* Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <th className="px-4 py-3 w-1/2">Item / Material</th>
                          <th className="px-4 py-3 w-1/6">Qty</th>
                          <th className="px-4 py-3 w-1/6">Unit</th>
                          <th className="px-4 py-3 w-10" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((it, idx) => (
                          <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-3 py-2.5">
                              <input
                                type="text"
                                value={it.item}
                                onChange={(e) => updateItem(idx, 'item', e.target.value)}
                                placeholder="e.g. Ergonomic Chair"
                                className="w-full text-sm border border-transparent hover:border-slate-200 focus:border-blue-400 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-600/10 transition bg-transparent focus:bg-white"
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <input
                                type="number"
                                value={it.qty}
                                min="1"
                                onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                                placeholder="25"
                                className="w-full text-sm border border-transparent hover:border-slate-200 focus:border-blue-400 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-600/10 transition bg-transparent focus:bg-white font-mono"
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <select
                                value={it.unit}
                                onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                                className="w-full text-sm border border-transparent hover:border-slate-200 focus:border-blue-400 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-600/10 transition bg-transparent focus:bg-white font-mono"
                              >
                                {UNITS.map((u) => <option key={u}>{u}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2.5">
                              {items.length > 1 && (
                                <button
                                  onClick={() => removeItem(idx)}
                                  className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Assign Vendors */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900">Assign Vendors</h2>
                    <p className="text-xs text-slate-500">Search and add vendors to receive this RFQ.</p>
                  </div>

                  {/* Search input */}
                  <div className="relative" ref={vendorRef}>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                      </svg>
                      <input
                        id="vendor-search"
                        type="text"
                        value={vendorQuery}
                        onChange={(e) => handleVendorSearch(e.target.value)}
                        placeholder="Search vendor by name or email…"
                        className="w-full text-sm border border-slate-200 rounded-xl pl-9 pr-4 py-3 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 outline-none transition"
                      />
                      {vendorSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Dropdown results */}
                    {vendorResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                        {vendorResults.map((v) => (
                          <button
                            key={v._id}
                            onClick={() => addVendor(v)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-slate-100 last:border-0"
                          >
                            <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-600 text-xs uppercase shrink-0">
                              {(v.name || v.email)[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{v.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{v.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assigned vendor chips */}
                  {assignedVendors.length > 0 && (
                    <div className="space-y-2">
                      {assignedVendors.map((v) => (
                        <div
                          key={v._id}
                          className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-md bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-600 text-[10px] uppercase">
                              {(v.name || v.email)[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{v.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{v.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeVendor(v._id)}
                            className="w-6 h-6 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {assignedVendors.length === 0 && (
                    <p className="text-xs text-slate-400 font-medium italic">No vendors assigned yet. Search above to add.</p>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => { setLocalError(''); setStep(1); }}
                    className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back
                  </button>
                  <button
                    onClick={() => { if (validateStep2()) setStep(3); }}
                    className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all active:scale-[0.99] flex items-center gap-2"
                  >
                    Continue to Attachments
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: ATTACHMENTS + SUBMIT ────────────────────── */}
            {step === 3 && (
              <div className="p-8 space-y-8">
                <div>
                  <h2 className="text-base font-black text-slate-900">Attachments</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Upload specifications, drawings, or any relevant documents.</p>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200
                    ${dragOver
                      ? 'border-blue-400 bg-blue-50 scale-[1.01]'
                      : 'border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30'}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
                    ${dragOver ? 'bg-blue-100 text-blue-600' : 'bg-white border border-slate-200 text-slate-400'}`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">Drag &amp; drop files here</p>
                    <p className="text-xs text-slate-400 mt-0.5">or click to browse — PDF, DOCX, XLSX, PNG up to 10MB each</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[260px]">{f.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{(f.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setFiles((prev) => prev.filter((_, fi) => fi !== i))}
                          className="w-6 h-6 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* RFQ Summary preview */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RFQ Summary</p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400">Title</p>
                      <p className="font-bold text-white mt-0.5 truncate">{title || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Category</p>
                      <p className="font-bold text-white mt-0.5">{category || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Deadline</p>
                      <p className="font-bold text-white mt-0.5 font-mono">{deadline || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Line Items</p>
                      <p className="font-bold text-white mt-0.5 font-mono">{items.filter((i) => i.item).length}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400">Vendors Assigned</p>
                      <p className="font-bold text-white mt-0.5">{assignedVendors.length > 0 ? assignedVendors.map((v) => v.name).join(', ') : '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation + Actions */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => { setLocalError(''); setStep(2); }}
                    className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back
                  </button>

                  <div className="flex gap-3">
                    {/* Save as Draft */}
                    <button
                      onClick={handleSaveDraft}
                      disabled={draftLoading || submitLoading}
                      id="save-draft-btn"
                      className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {draftLoading ? (
                        <span className="bridge-btn-spinner">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1" />
                            <line x1="12" y1="5" x2="12" y2="10" />
                            <path d="M6 10 Q12 5 18 10" />
                            <line x1="6" y1="10" x2="6" y2="15" />
                            <line x1="18" y1="10" x2="18" y2="15" />
                          </svg>
                          Saving…
                        </span>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save as Draft
                        </>
                      )}
                    </button>

                    {/* Send to Vendors */}
                    <button
                      onClick={handleSendToVendors}
                      disabled={submitLoading || draftLoading}
                      id="send-rfq-btn"
                      className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitLoading ? (
                        <span className="bridge-btn-spinner">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1" />
                            <line x1="12" y1="5" x2="12" y2="10" />
                            <path d="M6 10 Q12 5 18 10" />
                            <line x1="6" y1="10" x2="6" y2="15" />
                            <line x1="18" y1="10" x2="18" y2="15" />
                          </svg>
                          Sending to Vendors…
                        </span>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Send to Vendors
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
