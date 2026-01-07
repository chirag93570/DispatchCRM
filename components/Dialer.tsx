import React, { useState, useEffect, useRef } from 'react';
import { Phone, X, PhoneOff, Mic, MicOff, GripHorizontal, Users, Pause, Play, Voicemail, Wifi, Volume2, User, Clock, AlertTriangle, ArrowRight, List, Circle } from 'lucide-react';
import { leadService } from '../services/leadService';
import { Lead } from '../types';

interface DialerProps {
    initialNumber?: string;
    incomingCall?: { from: string, name: string } | null;
    onAcceptCall?: () => void;
    onRejectCall?: () => void;
}

export const Dialer: React.FC<DialerProps> = ({ initialNumber, incomingCall, onAcceptCall, onRejectCall }) => {
  const [number, setNumber] = useState(initialNumber || '');
  const [status, setStatus] = useState('Idle'); // Idle, Calling, In Call, Incoming
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isRecording, setIsRecording] = useState(true); // Default to auto-record
  const [dialMode, setDialMode] = useState<'MANUAL' | 'PREDICTIVE'>('MANUAL');
  const [showKeypad, setShowKeypad] = useState(true);
  
  // Sidebar State
  const [sidebarView, setSidebarView] = useState<'QUEUE' | 'HISTORY'>('QUEUE');
  const [queueLeads, setQueueLeads] = useState<Lead[]>([]);

  // Audio Refs
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const ringtoneRef = useRef<HTMLAudioElement>(null);

  // Load Queue
  useEffect(() => {
      leadService.getAllLeads().then(leads => {
          // Simple filtering for the sidebar queue
          const queue = leads.filter(l => l.status === 'NEW' || l.status === 'RETRY');
          setQueueLeads(queue);
      });
  }, []);

  // Handle Initial Number
  useEffect(() => {
      if (initialNumber) setNumber(initialNumber);
  }, [initialNumber]);

  // Handle Incoming Call Props
  useEffect(() => {
      if (incomingCall) {
          setStatus('Incoming');
          if (ringtoneRef.current) {
              ringtoneRef.current.loop = true;
              ringtoneRef.current.play().catch(e => console.log("Audio play error", e));
          }
      } else {
          if (ringtoneRef.current) {
              ringtoneRef.current.pause();
              ringtoneRef.current.currentTime = 0;
          }
          if (status === 'Incoming') setStatus('Idle');
      }
  }, [incomingCall]);

  // Timer
  useEffect(() => {
      let interval: any;
      if (status === 'In Call') {
          interval = setInterval(() => setDuration(d => d + 1), 1000);
      } else {
          setDuration(0);
      }
      return () => clearInterval(interval);
  }, [status]);

  const handleCall = () => {
      if (!number) return;
      setStatus('Calling...');
      // Simulate Connection delay
      setTimeout(() => {
          setStatus('In Call');
      }, 1500);
  };

  const handleHangup = () => {
      // Log the call with recording URL if recorded
      leadService.logCall({
          companyName: incomingCall ? incomingCall.name : 'Manual Dial',
          phoneNumber: number,
          outcome: 'Disconnected',
          durationSeconds: duration,
          note: 'Dialer initiated call'
      });
      setStatus('Idle');
      setIsMuted(false);
      setIsOnHold(false);
  };

  const handleAccept = () => {
      if (onAcceptCall) onAcceptCall();
      setStatus('In Call');
  };

  const handleReject = () => {
      if (onRejectCall) onRejectCall();
      setStatus('Idle');
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const appendDigit = (digit: string) => setNumber(prev => prev + digit);

  return (
    <div className="flex h-full bg-gray-950 text-gray-100 font-sans">
      
      {/* Hidden Audio Elements */}
      <audio ref={remoteAudioRef} id="remoteMedia" autoPlay />
      <audio ref={ringtoneRef} src="https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3" />

      {/* LEFT: Queue & History Sidebar */}
      <div className="w-80 border-r border-gray-800 bg-gray-900 flex flex-col hidden lg:flex">
          {/* Agent Status */}
          <div className="p-4 border-b border-gray-800 bg-gray-850">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-lg font-bold">CS</div>
                  <div>
                      <h3 className="font-bold text-sm">Chirag Sharma</h3>
                      <div className="flex items-center gap-1 text-xs text-green-400">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div> Available
                      </div>
                  </div>
              </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
              <button 
                onClick={() => setSidebarView('QUEUE')}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider ${sidebarView === 'QUEUE' ? 'bg-gray-800 text-white border-b-2 border-primary-500' : 'text-gray-500 hover:bg-gray-800'}`}
              >
                  Lead Queue ({queueLeads.length})
              </button>
              <button 
                onClick={() => setSidebarView('HISTORY')}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider ${sidebarView === 'HISTORY' ? 'bg-gray-800 text-white border-b-2 border-primary-500' : 'text-gray-500 hover:bg-gray-800'}`}
              >
                  Recent
              </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
              {sidebarView === 'QUEUE' ? (
                  <div className="space-y-2">
                      {queueLeads.map(lead => (
                          <div key={lead.id} onClick={() => setNumber(lead.phoneNumber)} className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded border border-gray-800 cursor-pointer group">
                              <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-sm text-gray-200">{lead.companyName}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${lead.status === 'RETRY' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>{lead.status}</span>
                              </div>
                              <div className="flex justify-between items-end">
                                  <div className="text-xs text-gray-500 font-mono">{lead.phoneNumber}</div>
                                  <div className="opacity-0 group-hover:opacity-100 text-primary-400 text-xs flex items-center gap-1">
                                      Call <ArrowRight size={10} />
                                  </div>
                              </div>
                          </div>
                      ))}
                      {queueLeads.length === 0 && <div className="text-center text-gray-500 text-xs py-4">Queue empty</div>}
                  </div>
              ) : (
                  <div className="space-y-2">
                      {/* Mock History Items */}
                      <div className="p-3 hover:bg-gray-800 rounded flex justify-between items-center cursor-pointer" onClick={() => setNumber('(555) 123-4567')}>
                          <div>
                              <div className="text-sm font-medium">Apex Logistics</div>
                              <div className="text-xs text-gray-500">Yesterday • 2m 15s</div>
                          </div>
                          <PhoneOff size={14} className="text-gray-600" />
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* CENTER: Main Dialer Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[700px]">
              {/* Header */}
              <div className="bg-gray-850 p-4 border-b border-gray-800 flex justify-between items-center">
                  <div className="text-sm font-medium text-gray-300">RK Softphone</div>
                  <div className={`text-xs px-2 py-1 rounded-full border ${status === 'In Call' ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-gray-600 text-gray-400'}`}>
                      {status === 'Idle' ? 'Ready' : status}
                  </div>
              </div>

              {/* Call Status / Display */}
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 relative">
                   {/* Recording Indicator */}
                   {status === 'In Call' && isRecording && (
                       <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20 animate-pulse">
                           <div className="w-2 h-2 rounded-full bg-red-500"></div>
                           <span className="text-[10px] text-red-400 font-medium">REC</span>
                       </div>
                   )}

                   {status === 'Incoming' && (
                       <div className="absolute inset-0 z-20 bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in zoom-in-95">
                           <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                               <Phone size={40} className="text-green-500" />
                           </div>
                           <h2 className="text-2xl font-bold text-white mb-1">{incomingCall?.name || 'Unknown Caller'}</h2>
                           <p className="text-lg text-gray-400 mb-8">{incomingCall?.from}</p>
                           <div className="flex gap-8">
                               <button onClick={handleReject} className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 shadow-lg transition-transform active:scale-95">
                                   <PhoneOff size={28} text-white />
                               </button>
                               <button onClick={handleAccept} className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-500 shadow-lg transition-transform active:scale-95">
                                   <Phone size={28} text-white />
                               </button>
                           </div>
                       </div>
                   )}

                   <div className="text-center mb-8 w-full px-8">
                       {status === 'In Call' ? (
                           <>
                            <h2 className="text-2xl font-bold text-white mb-2">{incomingCall?.name || 'Manual Dial'}</h2>
                            <div className="text-5xl font-mono text-primary-400 tracking-wider mb-2">{formatTime(duration)}</div>
                            <div className="text-sm text-gray-500">{number}</div>
                           </>
                       ) : (
                           <input 
                            type="text" 
                            value={number} 
                            onChange={(e) => setNumber(e.target.value)}
                            placeholder="Enter Number..."
                            className="w-full bg-transparent text-center text-3xl font-mono outline-none text-white placeholder-gray-700"
                           />
                       )}
                   </div>

                   {/* Keypad */}
                   {(showKeypad && status !== 'In Call' && status !== 'Incoming') && (
                       <div className="grid grid-cols-3 gap-6 mb-8">
                           {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map((k) => (
                               <button 
                                key={k} 
                                onClick={() => appendDigit(k.toString())}
                                className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 text-2xl font-medium text-white transition-colors flex items-center justify-center shadow-lg active:scale-95"
                               >
                                   {k}
                               </button>
                           ))}
                       </div>
                   )}
              </div>

              {/* Controls Footer */}
              <div className="p-8 bg-gray-900 border-t border-gray-800">
                  <div className="grid grid-cols-4 gap-4 mb-6">
                      <button onClick={() => setIsMuted(!isMuted)} className={`flex flex-col items-center gap-1 ${isMuted ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                          <div className={`p-3 rounded-full ${isMuted ? 'bg-white text-black' : 'bg-gray-800'}`}>{isMuted ? <MicOff size={20}/> : <Mic size={20}/>}</div>
                          <span className="text-[10px]">Mute</span>
                      </button>
                      <button onClick={() => setShowKeypad(!showKeypad)} className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300">
                          <div className="p-3 rounded-full bg-gray-800"><GripHorizontal size={20}/></div>
                          <span className="text-[10px]">Keypad</span>
                      </button>
                      <button onClick={() => setIsRecording(!isRecording)} className={`flex flex-col items-center gap-1 ${isRecording ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'}`}>
                           <div className={`p-3 rounded-full ${isRecording ? 'bg-red-500/10 border border-red-500/30' : 'bg-gray-800'}`}>
                               <Circle size={20} fill={isRecording ? "currentColor" : "none"} />
                           </div>
                           <span className="text-[10px]">Rec</span>
                      </button>
                      <button onClick={() => setIsOnHold(!isOnHold)} className={`flex flex-col items-center gap-1 ${isOnHold ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}>
                           <div className="p-3 rounded-full bg-gray-800">{isOnHold ? <Play size={20}/> : <Pause size={20}/>}</div>
                           <span className="text-[10px]">{isOnHold ? 'Resume' : 'Hold'}</span>
                      </button>
                  </div>

                  <div className="flex justify-center">
                      {status === 'In Call' || status === 'Calling...' ? (
                          <button onClick={handleHangup} className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl transition-transform active:scale-95">
                              <PhoneOff size={32} />
                          </button>
                      ) : (
                          <button onClick={handleCall} className="w-16 h-16 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl transition-transform active:scale-95">
                              <Phone size={32} />
                          </button>
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};