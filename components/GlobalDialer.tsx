import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Minimize2, Delete, Grid, ExternalLink, Save } from 'lucide-react';
import { leadService } from '../services/leadService';

interface Props {
    isOpen: boolean;
    onToggle: () => void;
    initialNumber?: string;
}

export const GlobalDialer: React.FC<Props> = ({ isOpen, onToggle, initialNumber }) => {
  const [number, setNumber] = useState('');
  const [status, setStatus] = useState('Ready'); // Ready, Dialed
  const [note, setNote] = useState('');

  // Sync initial number
  useEffect(() => {
      if (initialNumber) {
          setNumber(initialNumber);
          if (!isOpen) onToggle();
      }
  }, [initialNumber]);

  // --- ACTIONS ---

  const handleClickToCall = () => {
      if (!number) return;

      // 1. Clean the number
      let dest = number.replace(/\D/g, '');
      if (dest.length === 10) dest = '+1' + dest;
      else if (!dest.startsWith('+')) dest = '+' + dest;

      // 2. Trigger System Protocol Handler
      // This tells Windows/Mac to "Call this number" using your default app (Physical Phone Driver or Softphone)
      window.location.href = `tel:${dest}`;
      
      setStatus('Dialed');
  };

  const handleLogCall = async (outcome: string) => {
      if (!number) return;
      
      // Save directly to Supabase
      await leadService.logCall({
          phoneNumber: number,
          outcome: outcome,
          durationSeconds: 0, // Manual logs don't track seconds automatically
          note: note || "Manual Log via Desk Phone"
      });

      // Reset
      setStatus('Ready');
      setNote('');
      setNumber('');
      onToggle(); // Close dialer
  };

  const handleClear = () => {
      setNumber(prev => prev.slice(0, -1));
  };

  // --- RENDER ---
  
  if (!isOpen) {
      return (
        <div className="fixed bottom-6 right-6 z-50">
            <button 
                onClick={onToggle}
                className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center bg-primary-600 hover:bg-primary-500 transition-transform hover:scale-105 active:scale-95"
            >
                <Phone className="text-white" />
            </button>
        </div>
      );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans animate-in slide-in-from-bottom-10" style={{height: '500px'}}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-gray-300">Desk Phone Mode</span>
            </div>
            <button onClick={onToggle} className="text-gray-500 hover:text-white"><Minimize2 size={18} /></button>
        </div>

        {/* Display */}
        <div className="p-6 text-center bg-gray-900 border-b border-gray-800">
            <div className="relative flex items-center justify-center mb-2">
                <input 
                    className="w-full bg-transparent text-center text-3xl font-mono text-white outline-none placeholder-gray-700" 
                    placeholder="Enter Number" 
                    value={number} 
                    onChange={(e) => setNumber(e.target.value)} 
                />
                {number.length > 0 && (
                    <button onClick={handleClear} className="absolute right-0 p-2 text-gray-500 hover:text-red-400">
                        <Delete size={20} />
                    </button>
                )}
            </div>
            <div className="text-xs text-gray-500">
                {status === 'Dialed' ? "Call sent to device..." : "Ready to dial"}
            </div>
        </div>

        {/* State Switcher: Keypad vs. Logging */}
        {status === 'Ready' ? (
            <div className="flex-1 bg-gray-900 flex flex-col">
                {/* Keypad */}
                <div className="flex-1 px-6 py-4 grid grid-cols-3 gap-3 content-center">
                    {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(k => (
                        <button 
                            key={k} 
                            onClick={() => setNumber(n => n + k)} 
                            className="h-10 rounded bg-gray-800 hover:bg-gray-700 text-white font-medium text-xl border border-gray-700"
                        >
                            {k}
                        </button>
                    ))}
                </div>
                {/* Dial Button */}
                <div className="p-6 pt-0 flex justify-center pb-8">
                    <button 
                        onClick={handleClickToCall} 
                        className="w-16 h-16 rounded-full flex items-center justify-center bg-green-600 hover:bg-green-500 text-white shadow-lg transition-transform active:scale-95"
                    >
                        <Phone size={28} />
                    </button>
                </div>
            </div>
        ) : (
            // LOGGING SCREEN (Shows after you click dial)
            <div className="flex-1 bg-gray-900 flex flex-col p-6 animate-in fade-in">
                <div className="text-center mb-4">
                    <div className="text-lg font-bold text-white mb-1">Call in Progress</div>
                    <div className="text-sm text-gray-400">Use your physical phone</div>
                </div>

                <textarea 
                    className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-primary-500 mb-4 h-24 resize-none"
                    placeholder="Call notes..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button 
                        onClick={() => handleLogCall('No Answer')} 
                        className="p-3 rounded bg-gray-800 hover:bg-red-900/30 text-red-400 font-medium text-sm border border-gray-700"
                    >
                        No Answer
                    </button>
                    <button 
                        onClick={() => handleLogCall('Completed')} 
                        className="p-3 rounded bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm flex items-center justify-center gap-2"
                    >
                        <Save size={16} /> Log & Save
                    </button>
                </div>
                
                <button 
                    onClick={() => setStatus('Ready')} 
                    className="mt-4 text-xs text-gray-500 hover:text-white underline text-center"
                >
                    Back to Keypad
                </button>
            </div>
        )}
    </div>
  );
};