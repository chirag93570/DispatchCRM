import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { Phone, MapPin, Truck, Clock, User, AlertCircle, Save, Edit2, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { leadService } from '../services/leadService';

interface Props {
  lead: Lead | null;
  onDisposition: (status: LeadStatus, note: string) => void;
  onUpdateNote: (note: string) => void;
  currentNote: string;
}

const ActiveLeadPanel: React.FC<Props> = ({ lead, onDisposition, onUpdateNote, currentNote }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  // Initialize edit form when entering edit mode
  const startEditing = () => {
    if (lead) {
      setEditForm({
        companyName: lead.companyName,
        phoneNumber: lead.phoneNumber,
        email: lead.email,
        state: lead.state,
        truckCount: lead.truckCount,
        mcNumber: lead.mcNumber
      });
      setIsEditing(true);
    }
  };

  const saveEdits = async () => {
    if (!lead || !editForm) return;
    // We reuse the addLead method's logic or a new update method could be made, 
    // but typically we need an updateLead method. 
    // For now, we assume updateLeadStatus handles status, so we need a generic update.
    // Let's assume we patch leadService to handle generic updates or just do it here for now:
    try {
        // NOTE: In a perfect world, we add updateLeadDetails to leadService. 
        // For this step, we will assume it updates locally and refresh effectively on next load.
        // To make it REAL, we need to call Supabase directly here or add a service method.
        // We will do a direct service call update here to keep it simple.
        await leadService.updateLeadDetails(lead.id, editForm);
        setIsEditing(false);
        // Force a soft reload or parent needs to refresh. 
        // Since we don't have a parent refresh prop for details, the UI might lag until next click.
        // Ideally, we add onRefresh to props, but let's stick to the current interface.
        window.location.reload(); // Simple brute force refresh to show changes
    } catch (err) {
        console.error("Failed to update", err);
    }
  };

  const renderDispositionButton = (status: LeadStatus, label: string, colorClass: string) => (
      <button
        onClick={() => onDisposition(status, currentNote)}
        className={`w-full py-2.5 rounded text-sm font-medium transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-sm ${colorClass} text-white`}
      >
        {label}
      </button>
  );

  if (!lead) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-900 border border-gray-800 rounded-lg p-8 text-center shadow-lg">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-gray-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-300">No Active Lead</h2>
        <p className="text-gray-500 mt-2">Select a lead from the queue or add a new one.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 relative">
      
      {/* Top Card: Company Info & Contact */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-2">
                 <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-gray-800 text-gray-400 border border-gray-700">
                   #{String(lead.serialNumber)}
                 </span>
                 {isEditing ? (
                     <input 
                        value={editForm.mcNumber}
                        onChange={e => setEditForm({...editForm, mcNumber: e.target.value})}
                        className="bg-gray-950 border border-gray-700 text-xs px-2 py-0.5 rounded text-white w-24"
                     />
                 ) : (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-gray-800 text-gray-400 border border-gray-700">
                    {String(lead.mcNumber)}
                    </span>
                 )}
             </div>

            {isEditing ? (
                <input 
                    value={editForm.companyName}
                    onChange={e => setEditForm({...editForm, companyName: e.target.value})}
                    className="text-2xl font-bold text-white bg-gray-950 border border-gray-700 rounded p-1 w-full mb-2"
                />
            ) : (
                <h1 className="text-3xl font-bold text-white mb-1">{String(lead.companyName)}</h1>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-400">
              {isEditing ? (
                  <div className="flex gap-2">
                      <input value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})} className="bg-gray-950 border border-gray-700 w-16 px-1 rounded" placeholder="State"/>
                      <input type="number" value={editForm.truckCount} onChange={e => setEditForm({...editForm, truckCount: parseInt(e.target.value)})} className="bg-gray-950 border border-gray-700 w-16 px-1 rounded" placeholder="Trucks"/>
                  </div>
              ) : (
                  <>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {String(lead.state || 'N/A')}</span>
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {String(lead.truckCount || 0)} Power Units</span>
                  </>
              )}
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
             <div className="font-semibold text-lg text-primary-400">{String(lead.status)}</div>
             {isEditing ? (
                 <div className="flex gap-2">
                     <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-800 rounded hover:bg-gray-700 text-gray-300"><X size={16}/></button>
                     <button onClick={saveEdits} className="p-2 bg-green-600 rounded hover:bg-green-500 text-white"><Check size={16}/></button>
                 </div>
             ) : (
                 <button onClick={startEditing} className="p-2 bg-gray-800 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                     <Edit2 size={16} />
                 </button>
             )}
          </div>
        </div>

        {/* Contact Bar */}
        <div className="flex flex-wrap gap-4 items-center bg-gray-950/50 p-4 rounded-lg border border-gray-800 relative z-10">
          <div className="flex-1">
             <div className="text-xs text-gray-500 mb-1">Phone Number</div>
             {isEditing ? (
                 <input value={editForm.phoneNumber} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} className="bg-gray-950 border border-gray-700 text-white p-1 rounded w-full" />
             ) : (
                 <div className="text-xl font-mono text-gray-200 tracking-wide">{String(lead.phoneNumber)}</div>
             )}
          </div>
          <div className="flex-1 border-l border-gray-800 pl-4">
             <div className="text-xs text-gray-500 mb-1">Email</div>
             {isEditing ? (
                 <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="bg-gray-950 border border-gray-700 text-white p-1 rounded w-full" />
             ) : (
                 <div className="text-sm text-gray-300 truncate">{String(lead.email)}</div>
             )}
          </div>
        </div>
      </div>

      {/* Middle Section: Notes & Disposition */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        
        {/* Left Col: Note Taking & History */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col shadow-lg">
          <div className="p-3 border-b border-gray-800 bg-gray-850 font-medium text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" />
              Call Notes & History
          </div>
          
          {/* Note Input */}
          <div className="p-4 flex-1 flex flex-col min-h-0">
            <label className="text-xs text-gray-500 uppercase font-semibold mb-2">Current Call Notes</label>
            <textarea
              className="w-full h-32 bg-gray-950 border border-gray-700 rounded-md p-3 text-gray-200 resize-none focus:outline-none focus:border-primary-500 transition-colors text-sm placeholder-gray-600 font-mono mb-4"
              placeholder="Enter details about the call..."
              value={currentNote}
              onChange={(e) => onUpdateNote(e.target.value)}
            />
            
            <div className="flex-1 overflow-y-auto border-t border-gray-800 pt-4">
                 <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Previous Interactions</h4>
                 {lead.notes && lead.notes.length > 0 ? (
                  <div className="space-y-3">
                    {lead.notes.slice().reverse().map((note) => (
                      <div key={note.id} className="text-sm">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                           <span>Dispatcher</span>
                           <span>{note.timestamp ? format(new Date(note.timestamp), 'MMM d, h:mm a') : '-'}</span>
                        </div>
                        <div className="p-2 bg-gray-800 rounded text-gray-300 border border-gray-700/50 whitespace-pre-wrap">
                          {String(note.content)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-600 text-sm py-4 italic">No history yet.</div>
                )}
            </div>
          </div>
        </div>

        {/* Right Col: Disposition Actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-lg flex flex-col overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-200 mb-6 flex items-center gap-2">
                <Save className="w-5 h-5 text-primary-500" />
                Call Disposition
            </h3>
            
            <div className="space-y-6">
                {/* Positive Outcomes */}
                <div>
                    <label className="text-xs text-green-500 font-bold uppercase mb-2 block tracking-wider">Positive Outcomes</label>
                    <div className="grid grid-cols-1 gap-2">
                        {renderDispositionButton(LeadStatus.INTERESTED, 'Interested / Send Info', 'bg-green-600 hover:bg-green-500')}
                        {renderDispositionButton(LeadStatus.ONBOARDED, 'ONBOARDED (Sale Closed)', 'bg-purple-600 hover:bg-purple-500')}
                    </div>
                </div>

                {/* Follow Up */}
                <div>
                    <label className="text-xs text-yellow-500 font-bold uppercase mb-2 block tracking-wider">Follow Up</label>
                    <div className="grid grid-cols-2 gap-2">
                        {renderDispositionButton(LeadStatus.RETRY, 'Retry Later', 'bg-yellow-600 hover:bg-yellow-500')}
                        <button onClick={() => onDisposition(LeadStatus.RETRY, 'Left Voicemail')} className="w-full py-2.5 rounded text-sm font-medium bg-yellow-600/50 hover:bg-yellow-500/50 text-yellow-100 border border-yellow-600/50">Left Voicemail</button>
                    </div>
                </div>

                {/* Negative Outcomes */}
                <div>
                    <label className="text-xs text-red-500 font-bold uppercase mb-2 block tracking-wider">Negative / Remove</label>
                    <div className="grid grid-cols-2 gap-2">
                         {renderDispositionButton(LeadStatus.NOT_INTERESTED, 'Not Interested', 'bg-gray-700 hover:bg-gray-600')}
                         {renderDispositionButton(LeadStatus.DNC, 'Do Not Call', 'bg-red-700 hover:bg-red-600')}
                         {renderDispositionButton(LeadStatus.WRONG_NUMBER, 'Wrong Number', 'bg-orange-700 hover:bg-orange-600')}
                         {renderDispositionButton(LeadStatus.DISCONNECTED_NUMBER, 'Disconnected', 'bg-red-900 hover:bg-red-800')}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveLeadPanel;