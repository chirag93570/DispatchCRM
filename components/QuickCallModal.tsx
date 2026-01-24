import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import { X, Phone, Clock, Save, Wifi } from 'lucide-react';
import { leadService } from '../services/leadService';

interface Props {
    lead: Lead;
    onClose: () => void;
    onUpdate: () => void;
}

// Yealink IP (Change if needed)
const YEALINK_IP = "192.168.1.92"; 
const YEALINK_URI = `https://${YEALINK_IP}/servlet?key=number=`;

export const QuickCallModal: React.FC<Props> = ({ lead, onClose, onUpdate }) => {
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [dialStatus, setDialStatus] = useState('Dialing...');
    const [manualDuration, setManualDuration] = useState<string>('0');

    // 1. AUTO-DIAL
    useEffect(() => {
        if (lead.phoneNumber) {
            let dest = lead.phoneNumber.replace(/\D/g, '');
            if (dest.length === 10) dest = '1' + dest; 
            const targetUrl = `${YEALINK_URI}${dest}`;
            
            console.log("Direct Dial to:", targetUrl);
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = targetUrl;
            document.body.appendChild(iframe);

            setTimeout(() => {
                document.body.removeChild(iframe);
                setDialStatus('Command Sent');
            }, 3000);
        }
    }, [lead.phoneNumber]);

    const handleDisposition = async (disposition: LeadStatus) => {
        setIsSaving(true);
        
        // 1. Update Status
        await leadService.updateLeadStatus(lead.id, disposition, note);
        
        // 2. Log Call with Timestamp (Instant History)
        // If user typed a duration, save it. Otherwise 0 (Sync will fix it later).
        const duration = parseInt(manualDuration) || 0;
        
        await leadService.logCall({
            phoneNumber: lead.phoneNumber,
            outcome: disposition,
            durationSeconds: duration * 60, // Convert minutes to seconds
            note: note || "Direct Dial - Yealink T31P"
        });

        onUpdate(); // Refresh Parent
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* HEADER */}
                <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
                    <div>
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            {lead.companyName}
                        </h3>
                        <div className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                            <Wifi size={12} />
                            {dialStatus} via {YEALINK_IP}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white p-2">
                        <X size={24} />
                    </button>
                </div>

                {/* LOGGING BODY */}
                <div className="p-6 flex flex-col gap-6 bg-gray-900">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <Clock size={12} /> Call Notes
                        </label>
                        <textarea 
                            autoFocus
                            className="w-full h-32 bg-gray-950 border border-gray-700 rounded-lg p-4 text-gray-200 resize-none focus:outline-none focus:border-primary-500 font-sans"
                            placeholder="Enter notes..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                    
                    {/* Manual Duration Override */}
                    <div className="flex items-center gap-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Duration (Min):</label>
                        <input 
                            type="number" 
                            className="bg-gray-950 border border-gray-700 rounded p-1 text-white w-16 text-center text-sm"
                            value={manualDuration}
                            onChange={(e) => setManualDuration(e.target.value)}
                        />
                        <span className="text-[10px] text-gray-500 italic">(Optional - Sync updates exact time later)</span>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-3 block">Select Outcome</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button disabled={isSaving} onClick={() => handleDisposition(LeadStatus.INTERESTED)} className="p-4 bg-green-600 hover:bg-green-500 rounded text-white text-sm font-medium transition-colors">
                                Interested
                            </button>
                            <button disabled={isSaving} onClick={() => handleDisposition(LeadStatus.RETRY)} className="p-4 bg-yellow-600 hover:bg-yellow-500 rounded text-white text-sm font-medium transition-colors">
                                Retry / Voicemail
                            </button>
                            <button disabled={isSaving} onClick={() => handleDisposition(LeadStatus.NOT_INTERESTED)} className="p-4 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 text-sm font-medium transition-colors">
                                Not Interested
                            </button>
                            <button disabled={isSaving} onClick={() => handleDisposition(LeadStatus.DNC)} className="p-4 bg-red-900/50 hover:bg-red-900 border border-red-800 rounded text-red-200 text-sm font-medium transition-colors">
                                DNC (Remove)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};