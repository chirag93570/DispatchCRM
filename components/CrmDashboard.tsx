import React, { useState, useEffect, useRef } from 'react';
import { DashboardStats, Lead, LeadStatus } from '../types';
import LeadQueueTable from './LeadQueueTable';
import { DollarSign, TrendingUp, Users, Activity, X, Phone, MapPin, Truck, Save, Clock, Send, Edit2, UploadCloud, RefreshCw, CloudLightning } from 'lucide-react';
import { leadService } from '../services/leadService';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

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
    const [isEditing, setIsEditing] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Lead>>({});
    
    // File Upload Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state with props
    useEffect(() => {
        if (activeLeadId) {
            const l = leads.find(l => l.id === activeLeadId);
            if (l) {
                setSelectedLead(l);
                setEditForm(l);
                setIsEditing(false);
            }
        }
    }, [activeLeadId, leads]);

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead);
        setEditForm(lead);
        setIsEditing(false);
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

    const handleSaveDetails = async () => {
        if (!selectedLead) return;
        setIsSaving(true);
        try {
            if (leadService.updateLeadDetails) {
                 await leadService.updateLeadDetails(selectedLead.id, editForm);
            }
            onRefresh();
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save", error);
        }
        setIsSaving(false);
    };

    // --- TELNYX SYNC HANDLER ---
    const handleAutoSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            const count = await leadService.autoSyncTelnyx();
            alert(`✅ Sync Complete! Updated ${count} calls from Telnyx.`);
            onRefresh();
        } catch (error: any) {
            alert(`❌ Sync Failed: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    // --- SMART CSV IMPORT HANDLER (FIXED ERROR HANDLING) ---
    const handleLeadsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Ask user for a Batch Name (Source)
            const batchName = prompt("Enter a name for this list (e.g. 'Monday Batch'):", file.name);
            if (!batchName) return; // User cancelled

            const reader = new FileReader();
            
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);
                    
                    if (data.length === 0) {
                        alert("File appears to be empty.");
                        return;
                    }

                    // SMART MAPPING: Matches your specific CSV format (DOT Number, Address, etc.)
                    const mapped = data.map((row: any) => {
                        // 1. Extract State from Address if column missing
                        let state = row['State'] || '';
                        const address = row['Address'] || '';
                        
                        if (!state && address) {
                            // Look for pattern "CITY, ST ZIP"
                            const match = address.match(/, ([A-Z]{2}) \d{5}/);
                            if (match) state = match[1];
                        }

                        return {
                            companyName: row['Company Name'] || row['Company'] || 'Unknown',
                            mcNumber: '', // Your file uses DOT, not MC
                            dotNumber: row['DOT Number'] ? String(row['DOT Number']) : '',
                            phoneNumber: row['Phone'] ? String(row['Phone']) : '',
                            email: row['Email'] || '',
                            state: state,
                            address: address, // Save full address
                            truckCount: parseInt(row['Trucks'] || '0')
                        };
                    });

                    // Send to Service
                    await leadService.bulkImportLeads(mapped, batchName);
                    alert(`✅ Successfully imported ${mapped.length} leads into list: "${batchName}"`);
                    onRefresh();
                    
                } catch (err: any) {
                    console.error("Import Error:", err);
                    alert(`❌ Import Failed: ${err.message || "Unknown error"}. Check console for details.`);
                }
            };

            reader.onerror = () => {
                alert("Failed to read the file.");
            };

            reader.readAsBinaryString(file);
        }
    };

    const activityLabel = stats.totalCallsToday > 50 ? "High" : stats.totalCallsToday > 20 ? "Moderate" : "Low";

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden bg-gray-950">
            {/* TOP HEADER & TOOLBAR */}
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
                
                <div className="flex gap-3">
                    {/* HIDDEN INPUT FOR FILE UPLOAD */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".csv,.xlsx" 
                        onChange={handleLeadsUpload} 
                    />
                    
                    {/* IMPORT BUTTON */}
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700 transition-colors text-sm"
                        title="Import Leads CSV"
                    >
                        <UploadCloud size={16} /> Import Leads
                    </button>

                    {/* SYNC BUTTON */}
                    <button 
                        onClick={handleAutoSync} 
                        disabled={isSyncing} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm ${isSyncing ? 'bg-blue-900/50 border-blue-800 text-blue-300' : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'}`}
                    >
                        <CloudLightning size={16} className={isSyncing ? "animate-pulse" : ""} /> 
                        {isSyncing ? "Syncing..." : "Sync Telnyx"}
                    </button>
                    
                    {/* REFRESH BUTTON */}
                    <button 
                        onClick={onRefresh} 
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* KPI STATS CARDS */}
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

            {/* MAIN CONTENT SPLIT VIEW */}
            <div className="flex-1 min-h-0 flex gap-6">
                
                {/* LEFT: LEAD QUEUE TABLE (Now supports Bulk Delete & Source Filtering) */}
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

                {/* RIGHT: LEAD DETAIL PANEL */}
                {selectedLead && (
                    <div className="w-96 bg-gray-900 border border-gray-800 rounded-lg flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200 shadow-2xl">
                        <div className="p-5 border-b border-gray-800 bg-gray-850 relative">
                            {/* Panel Actions */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button onClick={() => setIsEditing(!isEditing)} className={`text-gray-400 hover:text-white ${isEditing ? 'text-blue-400' : ''}`}>
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => setSelectedLead(null)} className="text-gray-500 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="pr-16">
                                {/* Editable Company Name */}
                                {isEditing ? (
                                    <input 
                                        className="bg-gray-800 text-white font-bold text-lg w-full mb-2 rounded px-2 py-1 border border-gray-700"
                                        value={editForm.companyName}
                                        onChange={e => setEditForm({...editForm, companyName: e.target.value})}
                                    />
                                ) : (
                                    <h3 className="text-lg font-bold text-white leading-tight mb-1">{selectedLead.companyName}</h3>
                                )}
                                
                                {/* Header Details (DOT/State/Source) */}
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">
                                        {isEditing ? (
                                            <input 
                                                className="bg-gray-700 text-white w-24 rounded px-1"
                                                value={editForm.dotNumber || editForm.mcNumber}
                                                placeholder="DOT#"
                                                onChange={e => setEditForm({...editForm, dotNumber: e.target.value})}
                                            />
                                        ) : (selectedLead.dotNumber ? `DOT:${selectedLead.dotNumber}` : selectedLead.mcNumber)}
                                    </span>
                                    <span className="flex items-center gap-0.5"><MapPin size={10} /> {selectedLead.state || 'N/A'}</span>
                                    <span className="flex items-center gap-0.5"><Truck size={10} /> {selectedLead.truckCount || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Panel Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            
                            {/* Status Selector */}
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

                            {/* Contact Details - Editable */}
                            <div className="bg-gray-950 p-3 rounded border border-gray-800 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Phone</span>
                                    {isEditing ? (
                                        <input 
                                            className="bg-gray-800 text-white text-sm w-32 rounded px-1 border border-gray-700"
                                            value={editForm.phoneNumber}
                                            onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})}
                                        />
                                    ) : (
                                        <span className="text-sm font-mono text-primary-400 font-medium">{selectedLead.phoneNumber}</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Email</span>
                                    {isEditing ? (
                                        <input 
                                            className="bg-gray-800 text-white text-sm w-40 rounded px-1 border border-gray-700"
                                            value={editForm.email}
                                            onChange={e => setEditForm({...editForm, email: e.target.value})}
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-300 truncate max-w-[180px]">{selectedLead.email}</span>
                                    )}
                                </div>
                                {isEditing && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Address</span>
                                        <input 
                                            className="bg-gray-800 text-white text-sm w-40 rounded px-1 border border-gray-700"
                                            value={editForm.address}
                                            onChange={e => setEditForm({...editForm, address: e.target.value})}
                                        />
                                    </div>
                                )}
                                
                                {isEditing ? (
                                    <button 
                                        onClick={handleSaveDetails}
                                        className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Save size={14} /> Save Changes
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => onQuickCall(selectedLead)}
                                        className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Phone size={14} /> Call Now
                                    </button>
                                )}
                            </div>

                            {/* Notes Section */}
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