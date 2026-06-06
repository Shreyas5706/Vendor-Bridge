import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../auth/auth.slice';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import BridgeLoader from '../../components/BridgeLoader';

const VendorPage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [currentView, setCurrentView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quotation Modal State
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [quoteItems, setQuoteItems] = useState({});
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  const vendorNavLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: '⧉' },
    { id: 'rfqs', label: 'My RFQs', icon: '📄' },
    { id: 'quotations', label: 'My Quotations', icon: '📊' },
    { id: 'invoices', label: 'Invoices', icon: '🏛️' }
  ];

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
      const response = await axios.get('http://localhost:3000/api/auth/vendor-dashboard', config);
      if (response.data.success) {
        setDashboardData(response.data);
      } else {
        setError(response.data.message || 'Failed to fetch vendor dashboard data');
      }
    } catch (err) {
      console.error('Fetch vendor dashboard error:', err);
      setError(err.response?.data?.message || 'Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleOpenQuoteModal = (rfq) => {
    setSelectedRfq(rfq);
    const initialItems = {};
    rfq.items?.forEach(item => {
      initialItems[item.productName] = '';
    });
    setQuoteItems(initialItems);
    setDeliveryNotes('');
    setQuoteModalOpen(true);
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setSubmittingQuote(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        rfqId: selectedRfq._id,
        deliveryNotes,
        items: selectedRfq.items.map(item => ({
          productName: item.productName,
          quotedPricePerUnit: Number(quoteItems[item.productName])
        }))
      };
      
      await axios.post('http://localhost:3000/api/auth/quotation', payload, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      setQuoteModalOpen(false);
      fetchDashboard(); // Refresh to get updated quotations list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit quotation');
    } finally {
      setSubmittingQuote(false);
    }
  };

  if (loading) {
    return <BridgeLoader fullscreen message="Initialising Vendor Console..." />;
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded text-xs font-bold transition-all cursor-pointer text-white"
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

  const { vendor, rfqs, quotations } = dashboardData || {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans selection:bg-blue-50 selection:text-blue-600">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} navLinks={vendorNavLinks} />

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md z-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 font-mono">
            Vendor Terminal: <span className="text-slate-900">{vendor?.name}</span>
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[9px] bg-slate-100 border border-slate-300 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
              Status: {vendor?.status || 'ACTIVE'}
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
          </div>
        </header>

        <main className="p-8 flex-1 overflow-y-auto space-y-8">
          {currentView === 'dashboard' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Dashboard</h3>
                <p className="text-slate-500 text-xs mt-1">Welcome back, Vendor — Today's Overview</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded space-y-2">
                  <span className="text-[10px] text-slate-500 font-black block uppercase tracking-wider">Active RFQ's</span>
                  <span className="text-3xl font-black font-mono text-slate-900">{rfqs?.filter(r=>r.status==='ACTIVE').length || 0}</span>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded space-y-2">
                  <span className="text-[10px] text-slate-500 font-black block uppercase tracking-wider">Pending Quotations</span>
                  <span className="text-3xl font-black font-mono text-blue-600">0</span>
                </div>
              </div>

              {/* RFQ List Overview */}
              <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 pb-2 border-b border-slate-200">
                    Recent RFQs Assigned to You
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[9px] text-slate-500 font-black uppercase tracking-wider">
                          <th className="py-2.5">RFQ Title</th>
                          <th className="py-2.5">Category</th>
                          <th className="py-2.5">Deadline</th>
                          <th className="py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rfqs && rfqs.length > 0 ? rfqs.slice(0, 5).map((rfq, i) => (
                          <tr key={i} className="hover:bg-slate-100/30 transition-colors">
                            <td className="py-3 font-mono font-bold text-slate-600">{rfq.title}</td>
                            <td className="py-3 text-slate-500">{rfq.category || 'Furniture'}</td>
                            <td className="py-3 font-mono text-slate-600">{new Date(rfq.deadline).toLocaleDateString()}</td>
                            <td className="py-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                rfq.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                              }`}>
                                {rfq.status}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="4" className="py-4 text-center text-slate-500">No active RFQs currently.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="pt-2 text-right">
                      <button onClick={() => setCurrentView('rfqs')} className="text-xs text-blue-600 font-bold hover:underline cursor-pointer">View All RFQs &rarr;</button>
                  </div>
              </div>
            </div>
          )}

          {currentView === 'rfqs' && (
             <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/30 flex justify-between items-center">
                  <span className="font-bold text-xs uppercase text-slate-500">Your Assigned RFQs</span>
                  <span className="text-[10px] text-slate-500 font-mono">{rfqs?.length || 0} Total</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[9px] text-slate-500 font-black uppercase tracking-wider bg-slate-50/20">
                        <th className="py-3 px-5">RFQ Title</th>
                        <th className="py-3 px-5">Category</th>
                        <th className="py-3 px-5">Issuing Company / PO</th>
                        <th className="py-3 px-5">Deadline</th>
                        <th className="py-3 px-5">Items</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rfqs && rfqs.length > 0 ? (
                        rfqs.map((rfq, idx) => (
                          <tr key={idx} className="hover:bg-slate-100/30 transition-colors">
                            <td className="py-3.5 px-5">
                              <span className="font-bold text-slate-700 block">{rfq.title}</span>
                              <span className="text-[10px] text-slate-500 max-w-xs truncate block">{rfq.description || 'No Description'}</span>
                            </td>
                            <td className="py-3.5 px-5 text-slate-500 font-semibold">{rfq.category || 'Furniture'}</td>
                            <td className="py-3.5 px-5">
                              <span className="text-slate-600 block">{rfq.createdBy?.name || 'Company'}</span>
                              <span className="text-[9px] text-slate-500 block font-mono">{rfq.createdBy?.email}</span>
                            </td>
                            <td className="py-3.5 px-5 text-slate-500 font-mono">
                              {new Date(rfq.deadline).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-5 text-slate-500 font-mono font-bold">
                              {rfq.items?.length || 0} Items
                            </td>
                            <td className="py-3.5 px-5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                rfq.status === 'ACTIVE' 
                                  ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                  : 'bg-amber-50 text-amber-600 border-amber-200'
                              }`}>
                                {rfq.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              {(() => {
                                const hasQuoted = quotations?.some(q => q.rfqId === rfq._id);
                                if (hasQuoted) {
                                  return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 uppercase tracking-wider">Submitted</span>;
                                }
                                if (rfq.status === 'ACTIVE') {
                                  return (
                                    <button 
                                      onClick={() => handleOpenQuoteModal(rfq)}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                                    >
                                      Send Quote
                                    </button>
                                  );
                                }
                                return <span className="text-[10px] text-slate-400">N/A</span>;
                              })()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-500 font-mono">
                            You have no assigned RFQs right now.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
          )}
        </main>
      </div>

      {/* QUOTATION MODAL */}
      {quoteModalOpen && selectedRfq && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900">Submit Quotation</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedRfq.title}</p>
              </div>
              <button 
                onClick={() => setQuoteModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 text-xl font-bold p-2"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleQuoteSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-2">Item Pricing</h4>
                <div className="space-y-3">
                  {selectedRfq.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-800">{item.productName}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">Qty: {item.quantity} {item.unit}</p>
                      </div>
                      <div className="w-1/3">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Price per Unit (₹)</label>
                        <input 
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 outline-none"
                          value={quoteItems[item.productName] || ''}
                          onChange={(e) => setQuoteItems({...quoteItems, [item.productName]: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="w-1/4 text-right">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Total (₹)</label>
                        <p className="font-mono font-bold text-blue-600">
                          {((Number(quoteItems[item.productName]) || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-2">Delivery Notes</h4>
                <textarea 
                  className="w-full border border-slate-300 rounded p-3 text-sm focus:border-blue-500 outline-none min-h-[100px]"
                  placeholder="Include expected delivery timeline, terms, or conditions..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                ></textarea>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded text-right flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Grand Total:</span>
                <span className="text-2xl font-black font-mono text-slate-900">
                  ₹{selectedRfq.items?.reduce((sum, item) => sum + ((Number(quoteItems[item.productName]) || 0) * item.quantity), 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setQuoteModalOpen(false)}
                  className="px-5 py-2 border border-slate-300 rounded text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingQuote}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold disabled:opacity-50"
                >
                  {submittingQuote ? 'Submitting...' : 'Submit Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorPage;
