import React, { useState } from 'react';
import { Phone, PhoneOff, GripHorizontal, Delete, Save } from 'lucide-react';
import { leadService } from '../services/leadService';

interface DialerProps {
    initialNumber?: string;
}

export const Dialer: React.FC<DialerProps> = ({ initialNumber }) => {
  const [number, setNumber] = useState(initialNumber || '');
  const [status, setStatus] = useState<'Idle' | 'Dialed'>('Idle');
  const [showKeypad, setShowKeypad] = useState(true);
  const [note, setNote] = useState('');

  // --- ACTIONS ---

  const handleCall = () => {
      if (!number) return;
      
      // 1. Clean the number format
      let dest = number.replace(/\D/g, '');
      if (dest.length === 10) dest = '+1' + dest;
      else if (!dest.startsWith('+')) dest = '+' + dest;

      // 2. Trigger the System/Desk Phone Handler
      // This forces the OS to handle the call (e.g., passing it to your Yealink if connected via CTI/USB)
      window.location.href = `tel:${dest}`;

      // 3. Update UI to "Log Mode" since the call is now happening off-screen
      setStatus('Dialed');
  };

  const handleLogCall = async (outcome: string) => {
      if (!number) return;
      
      await leadService.logCall({
          phoneNumber: number,
          outcome: outcome,
          durationSeconds: 0, // External calls don't track duration automatically
          note: note || "Manual Log - Desk Phone"
      });

      // Reset
      setStatus('Idle');
      setNote('');
      setNumber('');
  };

  const handleClear = () => {
      setNumber(prev => prev.slice(0, -1));
  };

  return (
    <div className="flex h-full bg-gray-950 text-gray-100 font-sans relative items-center justify-center">
      
      {/* DIALER UI CONTAINER */}
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[700px]">
          
          {/* Header */}
          <div className="bg-gray-850 p-4 border-b border-gray-800 flex justify-between items-center">
              <div className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Desk Phone Mode
              </div>
              <div className={`text-xs px-2 py-1 rounded-full border ${status === 'Dialed' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10' : 'border-gray-600 text-gray-400'}`}>
                  {status}
              </div>
          </div>

          {/* Screen Display */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 relative">
               
               {/* INPUT AREA */}
               <div className="text-center mb-8 w-full px-8 relative">
                   {status === 'Dialed' ? (
                       <div className="animate-in fade-in zoom-in duration-300">
                           <h2 className="text-3xl font-bold text-white mb-2">{number}</h2>
                           <p className="text-yellow-400 animate-pulse">Call sent to device...</p>
                       </div>
                   ) : (
                       <div className="relative">
                            <input 
                                type="text" 
                                value={number} 
                                onChange={(e) => setNumber(e.target.value)}
                                placeholder="Enter Number..."
                                className="w-full bg-transparent text-center text-3xl font-mono outline-none text-white placeholder-gray-700"
                            />
                            {number.length > 0 && (
                                <button onClick={handleClear} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-red-400">
                                    <Delete size={24} />
                                </button>
                            )}
                       </div>
                   )}
               </div>

               {/* KEYPAD (Only show when Idle) */}
               {(showKeypad && status === 'Idle') && (
                   <div className="grid grid-cols-3 gap-6 mb-8">
                       {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map((k) => (
                           <button 
                            key={k} 
                            onClick={() => setNumber(prev => prev + k.toString())}
                            className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 text-2xl font-medium text-white transition-colors flex items-center justify-center shadow-lg active:scale-95 border border-gray-700"
                           >
                               {k}
                           </button>
                       ))}
                   </div>
               )}

               {/* LOGGING INTERFACE (Only show when Dialed) */}
               {status === 'Dialed' && (
                   <div className="w-full px-8 animate-in slide-in-from-bottom-10">
                       <textarea 
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white text-sm outline-none focus:border-primary-500 mb-4 h-32 resize-none"
                            placeholder="Enter call notes here (e.g., 'Left voicemail', 'Interested')..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                       />
                       <div className="grid grid-cols-2 gap-4">
                           <button 
                                onClick={() => handleLogCall('No Answer')} 
                                className="p-4 rounded-xl bg-gray-800 hover:bg-red-900/30 text-red-400 font-medium border border-gray-700 transition-colors"
                           >
                               No Answer
                           </button>
                           <button 
                                onClick={() => handleLogCall('Completed')} 
                                className="p-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-lg"
                           >
                               <Save size={18} /> Save Log
                           </button>
                       </div>
                       <button 
                            onClick={() => setStatus('Idle')} 
                            className="mt-6 w-full text-center text-gray-500 text-xs hover:text-white underline"
                       >
                           Cancel / Return to Keypad
                       </button>
                   </div>
               )}
          </div>

          {/* Bottom Controls (Only visible in Idle) */}
          {status === 'Idle' && (
            <div className="p-8 bg-gray-900 border-t border-gray-800">
                <div className="flex justify-center items-center gap-8 mb-6">
                    <button onClick={() => setShowKeypad(!showKeypad)} className={`flex flex-col items-center gap-1 ${showKeypad ? 'text-primary-400' : 'text-gray-500'}`}>
                        <div className="p-3 rounded-full bg-gray-800"><GripHorizontal size={20}/></div>
                        <span className="text-[10px]">Keypad</span>
                    </button>
                </div>

                <div className="flex justify-center">
                    <button onClick={handleCall} className="w-20 h-20 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center text-white shadow-xl transition-transform active:scale-95 border-4 border-gray-900 ring-2 ring-green-600/30">
                        <Phone size={36} />
                    </button>
                </div>
            </div>
          )}
      </div>
    </div>
  );
};