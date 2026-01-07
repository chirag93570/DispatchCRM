import React, { useEffect, useState } from 'react';
import { leadService } from './services/leadService';
import { Lead, LeadStatus, DashboardStats, AppView } from './types';
import ActiveLeadPanel from './components/ActiveLeadPanel';
import CrmDashboard from './components/CrmDashboard';
import CallOverview from './components/CallOverview';
import CallHistory from './components/CallHistory';
import Settings from './components/Settings';
import Pipeline from './components/Pipeline';
import EmailMarketing from './components/EmailMarketing';
import RateConfirmation from './components/RateConfirmation';
import { Dialer } from './components/Dialer';
import { QuickCallModal } from './components/QuickCallModal';
import { AddLeadModal, ImportModal } from './components/LeadModals';
import { LayoutDashboard, Phone, Settings as SettingsIcon, LogOut, Headphones, Plus, Upload, DollarSign, Mail, PhoneCall, FileText, PhoneIncoming, X, BarChart } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('CRM_DASHBOARD');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [quickCallLead, setQuickCallLead] = useState<Lead | null>(null); // For Quick Modal
  const [stats, setStats] = useState<DashboardStats>({
    totalCallsToday: 0,
    interestedLeads: 0,
    retryQueue: 0,
    totalLeads: 0,
    leadsInQueue: 0,
    dncCount: 0,
    onboardedCount: 0,
    avgTalkTime: 0
  });
  const [currentNote, setCurrentNote] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Incoming Call State
  const [incomingCall, setIncomingCall] = useState<{from: string, name: string} | null>(null);

  // Data Refresh
  const refreshData = async () => {
    // Get leads (standard list, DFS removed as requested)
    const [allLeads, currentStats] = await Promise.all([
      leadService.getAllLeads(),
      leadService.getStats()
    ]);
    setLeads(allLeads);
    setStats(currentStats);
  };

  useEffect(() => {
    const init = async () => {
      await refreshData();
      const next = await leadService.getNextLead();
      setActiveLead(next);
    };
    init();

    // Global Incoming Call Simulation
    const callTimer = setTimeout(() => {
        setIncomingCall({ from: '(512) 555-0199', name: 'Rapid Logistics Inc.' });
    }, 15000); 

    return () => clearTimeout(callTimer);
  }, []);

  const handleAcceptIncoming = () => {
      setCurrentView('DIALER');
  };

  const handleRejectIncoming = () => {
      setIncomingCall(null);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans relative">
      
      {/* Global Incoming Call Modal (If not on Dialer) */}
      {incomingCall && currentView !== 'DIALER' && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-gray-900 border-2 border-green-500 rounded-2xl shadow-2xl p-8 flex flex-col items-center w-96 animate-bounce-subtle">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 animate-ping">
                      <PhoneIncoming className="text-green-500 w-10 h-10" />
                  </div>
                  <div className="text-gray-400 uppercase tracking-widest text-sm mb-1">Incoming Call</div>
                  <div className="font-bold text-2xl text-white mb-1">{incomingCall.name}</div>
                  <div className="font-mono text-gray-300 mb-8 text-lg">{incomingCall.from}</div>
                  
                  <div className="flex gap-6 w-full justify-center">
                      <button onClick={handleRejectIncoming} className="flex flex-col items-center gap-2 group">
                          <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:bg-red-500 transition-colors">
                              <X size={24} fill="white" />
                          </div>
                          <span className="text-xs text-gray-400">Decline</span>
                      </button>
                      <button onClick={handleAcceptIncoming} className="flex flex-col items-center gap-2 group">
                           <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-lg group-hover:bg-green-500 transition-colors animate-pulse">
                              <Phone size={24} fill="white" />
                          </div>
                          <span className="text-xs text-gray-400">Accept</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 text-primary-500">
            <Headphones className="w-8 h-8" />
            <div className="leading-tight">
              <h1 className="font-bold text-white tracking-tight">RK Dispatch</h1>
              <span className="text-xs text-gray-500 font-medium">CRM v3.2</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => setCurrentView('CRM_DASHBOARD')} className={`nav-btn ${currentView === 'CRM_DASHBOARD' ? 'active' : ''}`}>
            <LayoutDashboard className="w-5 h-5" /> CRM Dashboard
          </button>
          <button onClick={() => setCurrentView('CALL_OVERVIEW')} className={`nav-btn ${currentView === 'CALL_OVERVIEW' ? 'active' : ''}`}>
            <BarChart className="w-5 h-5" /> Call Overview
          </button>
           <button onClick={() => setCurrentView('DIALER')} className={`nav-btn ${currentView === 'DIALER' ? 'active' : ''}`}>
            <PhoneCall className="w-5 h-5" /> Dialer
          </button>
          <button onClick={() => setCurrentView('PIPELINE')} className={`nav-btn ${currentView === 'PIPELINE' ? 'active' : ''}`}>
            <DollarSign className="w-5 h-5" /> Sales Pipeline
          </button>
           <button onClick={() => setCurrentView('EMAIL_MARKETING')} className={`nav-btn ${currentView === 'EMAIL_MARKETING' ? 'active' : ''}`}>
            <Mail className="w-5 h-5" /> Email Marketing
          </button>
           <button onClick={() => setCurrentView('RATE_CONFIRMATION')} className={`nav-btn ${currentView === 'RATE_CONFIRMATION' ? 'active' : ''}`}>
            <FileText className="w-5 h-5" /> Rate Confirmation
          </button>
          <button onClick={() => setCurrentView('HISTORY')} className={`nav-btn ${currentView === 'HISTORY' ? 'active' : ''}`}>
            <Phone className="w-5 h-5" /> Call History
          </button>
          <button onClick={() => setCurrentView('SETTINGS')} className={`nav-btn ${currentView === 'SETTINGS' ? 'active' : ''}`}>
            <SettingsIcon className="w-5 h-5" /> Settings
          </button>

          <div className="pt-6 mt-6 border-t border-gray-800">
             <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Data Management</div>
             <button onClick={() => setShowAddModal(true)} className="nav-btn text-gray-400 hover:text-white"><Plus className="w-5 h-5" /> Add Lead</button>
             <button onClick={() => setShowImportModal(true)} className="nav-btn text-gray-400 hover:text-white"><Upload className="w-5 h-5" /> Import Leads</button>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-gray-800/50 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs font-bold">CS</div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-white truncate">Chirag Sharma</div>
              <div className="text-xs text-gray-500">Dispatcher</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-950">
        <style>{`
            .nav-btn { display: flex; width: 100%; align-items: center; gap: 12px; padding: 8px 12px; font-size: 0.875rem; font-weight: 500; border-radius: 6px; transition: all 0.2s; color: #9ca3af; }
            .nav-btn:hover { background-color: #1f2937; }
            .nav-btn.active { background-color: rgba(37, 99, 235, 0.1); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.2); }
        `}</style>

        {currentView === 'CRM_DASHBOARD' && (
            <CrmDashboard 
                stats={stats} 
                leads={leads} 
                onLeadSelect={(l) => setActiveLead(l)} 
                onQuickCall={(l) => setQuickCallLead(l)}
                onRefresh={refreshData}
                activeLeadId={activeLead?.id}
            />
        )}
        
        {currentView === 'CALL_OVERVIEW' && <CallOverview stats={stats} />}
        
        {currentView === 'DIALER' && (
            <Dialer 
                initialNumber={activeLead?.phoneNumber} 
                incomingCall={incomingCall}
                onAcceptCall={() => setIncomingCall(null)}
                onRejectCall={() => setIncomingCall(null)}
            />
        )}
        
        {currentView === 'PIPELINE' && <Pipeline />}
        {currentView === 'EMAIL_MARKETING' && <EmailMarketing />}
        {currentView === 'RATE_CONFIRMATION' && <RateConfirmation />}
        {currentView === 'HISTORY' && <CallHistory />}
        {currentView === 'SETTINGS' && <Settings />}

      </main>

      {/* Modals */}
      {showAddModal && <AddLeadModal onClose={() => setShowAddModal(false)} onSave={async (l) => { await leadService.addLead(l); await refreshData(); }} />}
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} onImport={async (d) => { await leadService.bulkImportLeads(d); await refreshData(); }} />}
      {quickCallLead && <QuickCallModal lead={quickCallLead} onClose={() => setQuickCallLead(null)} onUpdate={refreshData} />}
    </div>
  );
};

export default App;
