import React, { useState, useEffect, useRef } from 'react';
import { Phone, X, PhoneOff, Mic, MicOff, GripHorizontal, Pause, Play, Circle, ArrowRight } from 'lucide-react';
import { leadService } from '../services/leadService';
import { Lead } from '../types';
import { TelnyxRTC } from '@telnyx/webrtc';

interface DialerProps {
    initialNumber?: string;
    incomingCall?: { from: string, name: string } | null;
    onAcceptCall?: () => void;
    onRejectCall?: () => void;
}

export const Dialer: React.FC<DialerProps> = ({ initialNumber }) => {
  const [number, setNumber] = useState(initialNumber || '');
  const [status, setStatus] = useState('Idle'); // Idle, Connecting, In Call
  const [session, setSession] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  
  // Sidebar State
  const [sidebarView, setSidebarView] = useState<'QUEUE' | 'HISTORY'>('QUEUE');
  const [queueLeads, setQueueLeads] = useState<Lead[]>([]);

  // Audio Refs
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Initialize Telnyx Client
  useEffect(() => {
    const savedConfig = localStorage.getItem('sip_config');
    if (!savedConfig) return;

    const { username, password, displayName } = JSON.parse(savedConfig);
    
    // NOTE: In production, you should use a Login Token generated from your backend
    // rather than raw SIP credentials for better security.
    const telnyxClient = new TelnyxRTC({
      login: username,
      password: password
    });

    telnyxClient.on('telnyx.ready', () => console.log('Telnyx Client Ready'));
    telnyxClient.on('telnyx.error', (error: any) => console.error('Telnyx Error:', error));
    
    telnyxClient.on('telnyx.notification', (notification: any) => {
        const call = notification.call;
        switch (notification.type) {
            case 'callUpdate':
                if (call.state === 'ringing') {
                    // Handle incoming if needed
                } else if (call.state === 'active') {
                    setStatus('In Call');
                } else if (call.state === 'hangup' || call.state === 'destroy') {
                    setStatus('Idle');
                    setSession(null);
                }
                break;
        }
    });

    // Attach remote media
    telnyxClient.remoteElement = 'remoteMedia';
    
    telnyxClient.connect();
    setClient(telnyxClient);

    return () => {
        telnyxClient.disconnect();
    };
  }, []);

  // Load Queue
  useEffect(() => {
      leadService.getAllLeads().then(leads => {
          const queue = leads.filter(l => l.status === 'NEW' || l.status === 'RETRY');
          setQueueLeads(queue);
      });
  }, []);

  useEffect(() => {
      if (initialNumber) setNumber(initialNumber);
  }, [initialNumber]);


  const handleCall = () => {
      if (!number || !client) return;
      
      try {
          setStatus('Calling...');
          const newSession = client.newCall({
              destinationNumber: number,
              callerName: "RK Dispatch",
              callerNumber: "YOUR_DID_HERE" // Replace with your Telnyx purchased number
          });
          setSession(newSession);
      } catch (err) {
          console.error("Call failed", err);
          setStatus('Error');
      }
  };

  const handleHangup = () => {
      if (session) {
          session.hangup();
          leadService.logCall({
              phoneNumber: number,
              outcome: 'Completed',
              durationSeconds: 0, // Calculate real duration
              note: 'Telnyx WebRTC Call'
          });
      }
      setStatus('Idle');
      setIsMuted(false);
      setIsOnHold(false);
  };

  const toggleMute = () => {
      if (session) {
          session.toggleMuteAudio();
          setIsMuted(!isMuted);
      }
  };

  const toggleHold = () => {
      if (session) {
          if (isOnHold) session.unhold();
          else session.hold();
          setIsOnHold(!isOnHold);
      }
  };

  const appendDigit = (digit: string) => {
      setNumber(prev => prev + digit);
      if (session) {
          session.dtmf(digit);
      }
  };

  return (
    <div className="flex h-full bg-gray-950 text-gray-100 font-sans">
      
      {/* Hidden Audio Element for WebRTC */}
      <audio ref={remoteAudioRef} id="remoteMedia" autoPlay />

      {/* LEFT: Queue Sidebar */}
      <div className="w-80 border-r border-gray-800 bg-gray-900 flex flex-col hidden lg:flex">
          <div className="p-4 border-b border-gray-800 bg-gray-850">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-lg font-bold">CS</div>
                  <div>
                      <h3 className="font-bold text-sm">Agent</h3>
                      <div className="flex items-center gap-1 text-xs text-green-400">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div> Connected
                      </div>
                  </div>
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
              {queueLeads.map(lead => (
                  <div key={lead.id} onClick={() => setNumber(lead.phoneNumber)} className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded border border-gray-800 cursor-pointer group mb-2">
                      <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm text-gray-200">{lead.companyName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">{lead.status}</span>
                      </div>
                      <div className="flex justify-between items-end">
                          <div className="text-xs text-gray-500 font-mono">{lead.phoneNumber}</div>
                          <div className="opacity-0 group-hover:opacity-100 text-primary-400 text-xs flex items-center gap-1">
                              Call <ArrowRight size={10} />
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* CENTER: Main Dialer Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[700px]">
              {/* Header */}
              <div className="bg-gray-850 p-4 border-b border-gray-800 flex justify-between items-center">
                  <div className="text-sm font-medium text-gray-300">RK Softphone</div>
                  <div className={`text-xs px-2 py-1 rounded-full border ${status === 'In Call' ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-gray-600 text-gray-400'}`}>
                      {status}
                  </div>
              </div>

              {/* Display */}
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 relative">
                   <div className="text-center mb-8 w-full px-8">
                       {status === 'In Call' ? (
                           <>
                            <h2 className="text-2xl font-bold text-white mb-2">{number}</h2>
                            <div className="text-sm text-green-400">Connected</div>
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
                   {(showKeypad) && (
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
                      <button onClick={toggleMute} className={`flex flex-col items-center gap-1 ${isMuted ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                          <div className={`p-3 rounded-full ${isMuted ? 'bg-white text-black' : 'bg-gray-800'}`}>{isMuted ? <MicOff size={20}/> : <Mic size={20}/>}</div>
                          <span className="text-[10px]">Mute</span>
                      </button>
                      <button onClick={() => setShowKeypad(!showKeypad)} className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300">
                          <div className="p-3 rounded-full bg-gray-800"><GripHorizontal size={20}/></div>
                          <span className="text-[10px]">Keypad</span>
                      </button>
                      <button className={`flex flex-col items-center gap-1 text-gray-500`}>
                           <div className={`p-3 rounded-full bg-gray-800`}>
                               <Circle size={20} />
                           </div>
                           <span className="text-[10px]">Rec</span>
                      </button>
                      <button onClick={toggleHold} className={`flex flex-col items-center gap-1 ${isOnHold ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}>
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