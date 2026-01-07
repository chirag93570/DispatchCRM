import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { Phone, MapPin, Truck, Clock, User, AlertCircle, Mic, Sparkles, Save } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  lead: Lead | null;
  onDisposition: (status: LeadStatus, note: string) => void;
  onUpdateNote: (note: string) => void;
  currentNote: string;
}

const ActiveLeadPanel: React.FC<Props> = ({ lead, onDisposition, onUpdateNote, currentNote }) => {
  
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
          <div>
             <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-gray-800 text-gray-400 mb-2 border border-gray-700">
               #{String(lead.serialNumber)} | {String(lead.mcNumber)}
             </span>
            <h1 className="text-3xl font-bold text-white mb-1">{String(lead.companyName)}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {String(lead.state || 'N/A')}</span>
              <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {String(lead.truckCount || 0)} Power Units</span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Current Status</div>
             <div className="font-semibold text-lg text-primary-400">{String(lead.status)}</div>
          </div>
        </div>

        {/* Contact Bar */}
        <div className="flex flex-wrap gap-4 items-center bg-gray-950/50 p-4 rounded-lg border border-gray-800 relative z-10">
          <div className="flex-1">
             <div className="text-xs text-gray-500 mb-1">Phone Number</div>
             <div className="text-xl font-mono text-gray-200 tracking-wide">{String(lead.phoneNumber)}</div>
          </div>
          <div className="flex-1 border-l border-gray-800 pl-4">
             <div className="text-xs text-gray-500 mb-1">Email</div>
             <div className="text-sm text-gray-300 truncate">{String(lead.email)}</div>
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

            <div className="mt-auto pt-6 text-center">
                <p className="text-xs text-gray-500">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Selecting a disposition logs the call and loads the next lead.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveLeadPanel;