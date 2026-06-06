import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { logoutUser } from '../auth/auth.slice'
import BridgeLoader from '../../components/BridgeLoader'

const CompanyPage = () => {
  const { user, loading } = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  const handleLogout = () => {
    dispatch(logoutUser())
  }

  // Show cinematic loader while logout API call is in progress
  if (loading) {
    return <BridgeLoader fullscreen message="Signing Out…" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Company Dashboard</h1>
            <p className="text-slate-500">Welcome back, {user?.name || user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
        
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Your Profile Information</h2>
          <pre className="text-xs bg-slate-800 text-slate-300 p-4 rounded-xl overflow-auto shadow-inner">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default CompanyPage
