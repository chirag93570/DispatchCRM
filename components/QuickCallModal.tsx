import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import { X, Phone, PhoneOff, Mic, MicOff, Save, Clock, User, CheckCircle } from 'lucide-react';
import { leadService } from '../services/leadService';

interface Props {
    lead: Lead;
    onClose: () => void;
    onUpdate: () => void;
}

export const QuickCallModal: React.FC<Props> = ({ lead, onClose, onUpdate }) => {
    const [status, setStatus] = useState('Dialing...');
    const [duration, setDuration] = useState(0);
    const [note, setNote] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);

    useEffect(() => {
        // Simulate call connection
        const timer = setTimeout(() => {
            setStatus('Connected');
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        let interval: any;
        if (status === 'Connected' && !callEnded) {
            interval = setInterval(() => setDuration(d => d + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [status, callEnded]);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleHangup = () => {
        setStatus('Call Ended');
        setCallEnded(true);
    };

    const handleDisposition = async (disposition: LeadStatus) => {
        await leadService.updateLeadStatus(lead.id, disposition, note);
        // Log the call duration as well implicitly in service
        onUpdate();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${status === 'Connected' ? 'bg-green-500 animate-pulse' : status === 'Call Ended' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                        <div>
                            <h3 className="font-bold text-white text-lg">{lead.companyName}</h3>
                            <div className="text-xs text-gray-400 flex items-center gap-2">
                                <Phone size={12} /> {lead.phoneNumber}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-2xl font-mono font-bold text-primary-400 w-20 text-center">{formatTime(duration)}</div>
                        <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
                    </div>
                </div>

                <div className="flex-1 flex min-h-[400px]">
                    {/* Left: Call Controls */}
                    <div className="w-1/3 bg-gray-950 p-6 flex flex-col items-center justify-center border-r border-gray-800">
                        <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-6 relative">
                            <User size={40} className="text-gray-600" />
                            {status === 'Connected' && (
                                <span className="absolute -bottom-2 bg-green-900 text-green-300 text-[10px] px-2 py-0.5 rounded-full border border-green-700">Active</span>
                            )}
                        </div>
                        
                        <div className="text-center mb-8">
                            <div className="font-medium text-gray-300">{lead.companyName}</div>
                            <div className="text-sm text-gray-500 mt-1">{status}</div>
                        </div>

                        {!callEnded ? (
                             <div className="flex gap-4">
                                <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                                </button>
                                <button onClick={handleHangup} className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg animate-pulse">
                                    <PhoneOff size={24} />
                                </button>
                             </div>
                        ) : (
                            <div className="text-green-400 flex flex-col items-center">
                                <CheckCircle size={32} className="mb-2" />
                                <span className="text-sm">Call Completed</span>
                            </div>
                        )}
                    </div>

                    {/* Right: Notes & Disposition */}
                    <div className="flex-1 p-6 flex flex-col bg-gray-900">
                        <div className="flex-1 mb-6">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                <Clock size={12} /> Call Notes
                            </label>
                            <textarea 
                                autoFocus
                                className="w-full h-full bg-gray-950 border border-gray-700 rounded-lg p-4 text-gray-200 resize-none focus:outline-none focus:border-primary-500 font-sans"
                                placeholder="Type notes here while talking..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-3 block">Select Outcome & Save</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleDisposition(LeadStatus.INTERESTED)} className="p-3 bg-green-600 hover:bg-green-500 rounded text-white text-sm font-medium">Interested</button>
                                <button onClick={() => handleDisposition(LeadStatus.RETRY)} className="p-3 bg-yellow-600 hover:bg-yellow-500 rounded text-white text-sm font-medium">Retry / Voicemail</button>
                                <button onClick={() => handleDisposition(LeadStatus.NOT_INTERESTED)} className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 text-sm font-medium">Not Interested</button>
                                <button onClick={() => handleDisposition(LeadStatus.DNC)} className="p-3 bg-red-700 hover:bg-red-600 rounded text-white text-sm font-medium">DNC</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
