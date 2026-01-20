import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { leadService } from './services/leadService';
import { supabase } from './services/supabase';
import { Lead, DashboardStats } from './types';

// Components
import Login from './components/Login';
import CrmDashboard from './components/CrmDashboard';
import CallOverview from './components/CallOverview';
import CallHistory from './components/CallHistory';
import Settings from './components/Settings';
import Pipeline from './components/Pipeline';
import EmailMarketing from './components/EmailMarketing';
import RateConfirmation from './components/RateConfirmation';
import FleetManager from './components/FleetManager';
import LoadBoard from './components/LoadBoard'; // <--- NEW IMPORT
import { Dialer } from './components/Dialer';
import { QuickCallModal } from './components/QuickCallModal';
import { AddLeadModal, ImportModal } from './components/LeadModals';

// Icons
import { LayoutDashboard, Phone, Settings as SettingsIcon, Headphones, Plus, Upload, DollarSign, Mail, PhoneCall, FileText, BarChart, LogOut, Truck, Package } from 'lucide-react';

const ProtectedLayout: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        totalCallsToday: 0, interestedLeads: 0, retryQueue: 0, totalLeads: 0, 
        leadsInQueue: 0, dncCount: 0, onboardedCount: 0, avgTalkTime: 0
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [quickCallLead, setQuickCallLead] = useState<Lead | null>(null);

    const refreshData = async () => {
        const [allLeads, currentStats] = await Promise.all([
          leadService.getAllLeads(),
          leadService.getStats()
        ]);
        setLeads(allLeads);
        setStats(currentStats);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    // --- NAVIGATION MENU ---
    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'CRM Dashboard' },
        { path: '/loads', icon: Package, label: 'Load Board' }, // <--- NEW MENU ITEM
        { path: '/fleet', icon: Truck, label: 'Fleet Manager' }, 
        { path: '/dialer', icon: PhoneCall, label: 'Dialer' },
        { path: '/pipeline', icon: DollarSign, label: 'Sales Pipeline' },
        { path: '/overview', icon: BarChart, label: 'Call Overview' },
        { path: '/email', icon: Mail, label: 'Email Marketing' },
        { path: '/rates', icon: FileText, label: 'Rate Confirmation' },
        { path: '/history', icon: Phone, label: 'Call History' },
        { path: '/settings', icon: SettingsIcon, label: 'Settings' },
    ];

    return (
        <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans relative">
             <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/logo.png" 
                            alt="RK Dispatch Solutions" 
                            className="h-12 w-auto object-contain flex-shrink-0"
                            onError={(e) => {
                                // Hide logo if not found, show fallback
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                        <div className="leading-tight flex-1">
                            <h1 className="font-bold text-white tracking-tight text-lg">RK DISPATCH</h1>
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Solutions</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <button 
                            key={item.path}
                            onClick={() => navigate(item.path)} 
                            className={`flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${location.pathname === item.path ? 'bg-primary-900/20 text-primary-400 border border-primary-900/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <item.icon className="w-5 h-5" /> {item.label}
                        </button>
                    ))}

                    <div className="pt-6 mt-6 border-t border-gray-800">
                        <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Data Management</div>
                        <button onClick={() => setShowAddModal(true)} className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-400 hover:bg-gray-800 hover:text-white"><Plus className="w-5 h-5" /> Add Lead</button>
                        <button onClick={() => setShowImportModal(true)} className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-400 hover:bg-gray-800 hover:text-white"><Upload className="w-5 h-5" /> Import Leads</button>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-800">
                     <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-red-400 hover:bg-red-900/20 mb-2">
                         <LogOut className="w-5 h-5" /> Sign Out
                     </button>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-gray-800/50">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs font-bold">AG</div>
                        <div className="overflow-hidden">
                        <div className="text-sm font-medium text-white truncate">Agent</div>
                        <div className="text-xs text-gray-500">Active</div>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-gray-950 overflow-auto">
                <Routes>
                    <Route path="/" element={
                        <CrmDashboard 
                            stats={stats} 
                            leads={leads} 
                            onLeadSelect={() => {}} 
                            onQuickCall={(l) => setQuickCallLead(l)}
                            onRefresh={refreshData}
                        />
                    } />
                    {/* --- NEW ROUTES --- */}
                    <Route path="/fleet" element={<FleetManager />} />
                    <Route path="/loads" element={<LoadBoard />} /> {/* <--- NEW ROUTE */}
                    
                    <Route path="/overview" element={<CallOverview stats={stats} />} />
                    <Route path="/dialer" element={<Dialer />} />
                    <Route path="/pipeline" element={<Pipeline />} />
                    <Route path="/email" element={<EmailMarketing />} />
                    <Route path="/rates" element={<RateConfirmation />} />
                    <Route path="/history" element={<CallHistory />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </main>

            {/* Modals */}
            {showAddModal && <AddLeadModal onClose={() => setShowAddModal(false)} onSave={async (l) => { await leadService.addLead(l); await refreshData(); }} />}
            {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} onImport={async (d) => { await leadService.bulkImportLeads(d); await refreshData(); }} />}
            {quickCallLead && <QuickCallModal lead={quickCallLead} onClose={() => setQuickCallLead(null)} onUpdate={refreshData} />}
        </div>
    );
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
      return <div className="h-screen bg-gray-950 flex items-center justify-center text-primary-500">Loading CRM...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/*" element={session ? <ProtectedLayout>{null}</ProtectedLayout> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;