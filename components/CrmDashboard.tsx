import React, { useState, useEffect } from 'react';
import { DashboardStats, Lead, LeadStatus } from '../types';
import LeadQueueTable from './LeadQueueTable';
import { DollarSign, TrendingUp, Users, Activity, X, Phone, MapPin, Truck, Save, Clock, Send } from 'lucide-react';
import { leadService } from '../services/leadService';
import { format } from 'date-fns';

// Update Props to include the new stats structure
interface ExtendedStats extends DashboardStats {
    pipelineValue?: number;
    winRate?: number;
    activeDeals?: number;
}

interface Props {
  stats: ExtendedStats;
  leads: Lead[];
  onLeadSelect: (lead: Lead) => void;
  onQuickCall: (lead: Lead) => void;
  onRefresh: () => void;
  activeLeadId?: string;
}

const KpiCard = ({ label, value, sub, icon: Icon, color }: any) => (
    <div className="bg-gray-900 border border-gray-800 p-5 rounded-lg flex items-start justify-between hover:border-gray-700 transition-colors">
        <div>
            <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">{label}</div>
            <div className="text-2xl font-bold text-white mt-1">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{sub}</div>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-white`}>
            <Icon size={20} />
        </div>
    </div>
);

const CrmDashboard: React.FC<Props> = ({ stats, leads, onLeadSelect, onQuickCall, onRefresh, activeLeadId }) => {
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (activeLeadId) {
            const l = leads.find(l => l.id === activeLeadId);
            if (l) setSelectedLead(l);
        }
    }, [activeLeadId, leads]);

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead);
        onLeadSelect(lead); 
        setNoteContent(''); 
    };

    const handleStatusUpdate = async (newStatus: LeadStatus) => {
        if (!selectedLead) return;
        await leadService.updateLeadStatus(selectedLead.id, newStatus);
        onRefresh();
    };

    const handleSaveNote = async () => {
        if (!selectedLead || !noteContent.trim()) return;
        setIsSaving(true);
        await leadService.updateLeadStatus(selectedLead.id, selectedLead.status, noteContent);
        setNoteContent('');
        onRefresh();
        setIsSaving(false);
    };

    // Calculate dynamic activity label
    const activityLabel = stats.totalCallsToday > 50 ? "High" : stats.totalCallsToday > 20 ? "Moderate" : "Low";

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden bg-gray-950">
            {/* Logo Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img 
                        src="/logo.png" 
                        alt="RK Dispatch Solutions" 
                        className="h-16 w-auto object-contain"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                        }}
                    />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-100">CRM Dashboard</h2>
                        <p className="text-sm text-gray-400">Welcome back to your command center</p>
                    </div>
                </div>
            </div>

            {/* Business KPIs - NOW REAL */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 mb-8">
                <KpiCard 
                    label="Pipeline Value" 
                    value={`$${(stats.pipelineValue || 0).toLocaleString()}`} 
                    sub={`${stats.activeDeals || 0} Deals active`} 
                    icon={DollarSign} 
                    color="bg-green-600" 
                />
                <KpiCard 
                    label="Win Rate" 
                    value={`${stats.winRate || 0}%`} 
                    sub="Based on closed deals" 
                    icon={TrendingUp} 
                    color="bg-blue-600" 
                />
                <KpiCard 
                    label="New Leads" 
                    value={stats.leadsInQueue} 
                    sub="Waiting in queue" 
                    icon={Users} 
                    color="bg-purple-600" 
                />
                <KpiCard 
                    label="Activity" 
                    value={activityLabel} 
                    sub={`${stats.totalCallsToday} calls today`} 
                    icon={Activity} 
                    color="bg-orange-600" 
                />
            </div>

            <div className="flex-1 min-h-0 flex gap-6">
                
                {/* Left: Lead Queue Table */}
                <div className={`flex-1 flex flex-col bg-gray-900 border border-gray-800 rounded-lg overflow-hidden transition-all duration-300`}>
                    <div className="p-4 border-b border-gray-800 bg-gray-850 flex justify-between items-center">
                        <h3 className="font-bold text-gray-200">Active Queue</h3>
                        <div className="text-xs text-gray-500">Real-time Lead Priority</div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <LeadQueueTable 
                            leads={leads} 
                            onLeadSelect={handleLeadClick}
                            onQuickCall={onQuickCall}
                            onRefresh={onRefresh}
                            activeLeadId={selectedLead?.id} 
                        />
                    </div>
                </div>

                {/* Right: Lead Detail Panel */}
                {selectedLead && (
                    <div className="w-96 bg-gray-900 border border-gray-800 rounded-lg flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200 shadow-2xl">
                        <div className="p-5 border-b border-gray-800 bg-gray-850 relative">
                            <button onClick={() => setSelectedLead(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                                <X size={18} />
                            </button>
                            <div className="pr-6">
                                <h3 className="text-lg font-bold text-white leading-tight mb-1">{selectedLead.companyName}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">{selectedLead.mcNumber}</span>
                                    <span className="flex items-center gap-0.5"><MapPin size={10} /> {selectedLead.state || 'N/A'}</span>
                                    <span className="flex items-center gap-0.5"><Truck size={10} /> {selectedLead.truckCount || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Current Status</label>
                                <select 
                                    value={selectedLead.status}
                                    onChange={(e) => handleStatusUpdate(e.target.value as LeadStatus)}
                                    className="w-full bg-gray-950 border border-gray-700 rounded-md p-2 text-sm text-white focus:border-primary-500 outline-none cursor-pointer"
                                >
                                    {Object.values(LeadStatus).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-gray-950 p-3 rounded border border-gray-800 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Phone</span>
                                    <span className="text-sm font-mono text-primary-400 font-medium">{selectedLead.phoneNumber}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Email</span>
                                    <span className="text-sm text-gray-300 truncate max-w-[180px]">{selectedLead.email}</span>
                                </div>
                                <button 
                                    onClick={() => onQuickCall(selectedLead)}
                                    className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Phone size={14} /> Call Now
                                </button>
                            </div>

                            <div className="flex flex-col h-64">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Clock size={12} /> Call Notes
                                </label>
                                
                                <div className="flex gap-2 mb-3">
                                    <input 
                                        type="text" 
                                        value={noteContent}
                                        onChange={(e) => setNoteContent(e.target.value)}
                                        placeholder="Add a quick note..."
                                        className="flex-1 bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white focus:border-primary-500 outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                                    />
                                    <button 
                                        onClick={handleSaveNote}
                                        disabled={isSaving || !noteContent.trim()}
                                        className="bg-primary-600 text-white p-2 rounded hover:bg-primary-500 disabled:opacity-50"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto bg-gray-950 border border-gray-800 rounded p-3 space-y-3">
                                    {selectedLead.notes && selectedLead.notes.length > 0 ? (
                                        selectedLead.notes.slice().reverse().map((note) => (
                                            <div key={note.id} className="text-sm border-b border-gray-800 pb-2 last:border-0 last:pb-0">
                                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                    <span>Dispatcher</span>
                                                    <span>{note.timestamp ? format(new Date(note.timestamp), 'MMM d, h:mm a') : '-'}</span>
                                                </div>
                                                <div className="text-gray-300 leading-snug">
                                                    {note.content}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-600 text-xs py-4 italic">No notes available.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CrmDashboard;