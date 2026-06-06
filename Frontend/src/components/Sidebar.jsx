import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../Features/auth/auth.slice';
import BridgeIcon from '../assets/Bridge.png';

const Sidebar = ({ currentView, setCurrentView, navLinks }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const defaultLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: '⧉' },
    { id: 'vendors', label: 'Vendors', icon: '👥' },
    { id: 'rfqs', label: 'RFQ\'s', icon: '📄' },
    { id: 'quotations', label: 'Quotations', icon: '📊' },
    { id: 'approvals', label: 'Approvals', icon: '👔' },
    { id: 'pos', label: 'Purchase orders', icon: '✨' },
    { id: 'invoices', label: 'Invoices', icon: '🏛️' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'activity', label: 'Activity', icon: '⌛' }
  ];

  const linksToRender = navLinks || defaultLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20 shadow-sm">
      <div className="flex flex-col">
        {/* Logo Brand Header */}
        <div className="h-16 border-b border-slate-100 px-6 flex items-center gap-2 bg-white">
          <img src={BridgeIcon} alt="VendorBridge Logo" className="h-8 w-auto object-contain" />
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900">
              Vendor<span className="text-blue-600">Bridge</span>
            </h1>
            <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold -mt-0.5">
              ERP Management
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {linksToRender.map((link) => {
            const isActive = currentView === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setCurrentView && setCurrentView(link.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
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
      <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 uppercase">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="truncate">
            <p className="font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full py-1.5 mt-1 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded font-bold uppercase text-[9px] tracking-wider transition-colors cursor-pointer bg-white"
        >
          Sign Out Console
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
