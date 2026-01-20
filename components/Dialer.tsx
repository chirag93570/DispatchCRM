import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, GripHorizontal, Pause, Play, Circle, PhoneIncoming, AlertCircle, Wifi } from 'lucide-react';
import { leadService } from '../services/leadService';
import { Lead } from '../types';
import { TelnyxRTC } from '@telnyx/webrtc';

interface DialerProps {
    initialNumber?: string;
}

export const Dialer: React.FC<DialerProps> = ({ initialNumber }) => {
  const [number, setNumber] = useState(initialNumber || '');
  const [status, setStatus] = useState('Idle'); // Idle, Calling, Ringing, In Call
  const [connectionStatus, setConnectionStatus] = useState<'Disconnected' | 'Connecting' | 'Connected' | 'Error'>('Disconnected');
  const [client, setClient] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [incomingCallInfo, setIncomingCallInfo] = useState<{ number: string, id: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Audio Refs
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const ringbackRef = useRef<HTMLAudioElement | null>(null);

  // 1. Initialize Audio & Telnyx Client
  useEffect(() => {
    // Setup Sounds
    ringtoneRef.current = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3');
    ringtoneRef.current.loop = true;
    
    ringbackRef.current = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/Galaxy/dial_tone.mp3'); // Simple dial tone/ringback
    ringbackRef.current.loop = true;

    // Get Credentials
    const savedConfig = localStorage.getItem('sip_config');
    if (!savedConfig) {
        setErrorMessage("Missing SIP Credentials. Go to Settings.");
        setConnectionStatus('Error');
        return;
    }

    const { username, password } = JSON.parse(savedConfig);
    setConnectionStatus('Connecting');

    try {
        const telnyxClient = new TelnyxRTC({
            login: username,
            password: password,
        });

        // Connection Events
        telnyxClient.on('telnyx.ready', () => {
            console.log('Telnyx Client Ready');
            setConnectionStatus('Connected');
            setErrorMessage('');
        });

        telnyxClient.on('telnyx.error', (error: any) => {
            console.error('Telnyx Error:', error);
            setConnectionStatus('Error');
            setErrorMessage('Connection Failed: Check Credentials');
        });

        telnyxClient.on('telnyx.notification', (notification: any) => {
            const call = notification.call;
            if (!call) return;

            switch (notification.type) {
                case 'callUpdate':
                    if (call.state === 'ringing') {
                        // INCOMING CALL
                        setStatus('Ringing');
                        setIncomingCallInfo({ number: call.remoteNumber, id: call.id });
                        setSession(call);
                        ringtoneRef.current?.play().catch(e => console.log("Ringtone error", e));
                    } else if (call.state === 'active') {
                        // CALL CONNECTED
                        setStatus('In Call');
                        setIncomingCallInfo(null);
                        stopSounds();
                    } else if (call.state === 'hangup' || call.state === 'destroy') {
                        // CALL ENDED
                        resetCallState();
                    }
                    break;
            }
        });

        telnyxClient.remoteElement = 'remoteMedia';
        telnyxClient.connect();
        setClient(telnyxClient);

        // Cleanup on unmount
        return () => {
            telnyxClient.disconnect();
            stopSounds();
        };
    } catch (err) {
        setConnectionStatus('Error');
        setErrorMessage('Failed to initialize client');
    }
  }, []);

  // 2. Helper to Stop All Sounds
  const stopSounds = () => {
      if (ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
      }
      if (ringbackRef.current) {
          ringbackRef.current.pause();
          ringbackRef.current.currentTime = 0;
      }
  };

  const resetCallState = () => {
      setStatus('Idle');
      setSession(null);
      setIncomingCallInfo(null);
      setIsMuted(false);
      setIsOnHold(false);
      stopSounds();
  };

  // 3. Make Outbound Call
  const handleCall = () => {
      if (!number || !client || connectionStatus !== 'Connected') return;
      
      const savedConfig = localStorage.getItem('sip_config');
      const myNumber = savedConfig ? JSON.parse(savedConfig).username : "Unknown";

      try {
          setStatus('Calling...');
          
          // Play Ringback Sound (so you know it's calling)
          ringbackRef.current?.play().catch(e => console.log("Ringback error", e));

          const newSession = client.newCall({
              destinationNumber: number,
              callerName: "RK Dispatch",
              callerNumber: myNumber
          });
          setSession(newSession);
      } catch (err) {
          console.error("Call failed", err);
          setStatus('Error');
          stopSounds();
      }
  };

  const handleAnswer = () => {
      if (session) {
          session.answer();
          stopSounds();
      }
  };

  const handleHangup = () => {
      if (session) {
          session.hangup();
      }
      resetCallState();
  };

  // UI Components
  return (
    <div className="flex h-full bg-gray-950 text-gray-100 font-sans relative items-center justify-center">
      <audio ref={remoteAudioRef} id="remoteMedia" autoPlay />

      {/* CONNECTION STATUS BADGE (Top Right) */}
      <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 z-50">
          <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 
              connectionStatus === 'Connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className={`text-xs font-medium ${
              connectionStatus === 'Connected' ? 'text-green-400' : 
              connectionStatus === 'Connecting' ? 'text-yellow-400' : 'text-red-400'
          }`}>
              {connectionStatus === 'Connected' ? 'VoIP Ready' : connectionStatus}
          </span>
      </div>

      {/* ERROR MESSAGE */}
      {errorMessage && (
          <div className="absolute top-20 bg-red-900/80 text-white px-4 py-2 rounded-md flex items-center gap-2 animate-bounce z-50">
              <AlertCircle size={16} /> {errorMessage}
          </div>
      )}

      {/* INCOMING CALL POPUP */}
      {status === 'Ringing' && incomingCallInfo && (
          <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-ping">
                  <PhoneIncoming size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{incomingCallInfo.number}</h2>
              <p className="text-gray-400 mb-12">Incoming Call...</p>
              
              <div className="flex gap-12">
                  <button onClick={handleHangup} className="flex flex-col items-center gap-2 group">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover:bg-red-500 transition-colors">
                          <PhoneOff size={32} />
                      </div>
                      <span className="text-sm font-medium text-gray-400">Reject</span>
                  </button>

                  <button onClick={handleAnswer} className="flex flex-col items-center gap-2 group">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg group-hover:bg-green-400 transition-colors animate-bounce">
                          <Phone size={32} />
                      </div>
                      <span className="text-sm font-medium text-gray-400">Answer</span>
                  </button>
              </div>
          </div>
      )}

      {/* DIALER PHONE UI */}
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[700px]">
          {/* Header */}
          <div className="bg-gray-850 p-4 border-b border-gray-800 flex justify-between items-center">
              <div className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Wifi size={14} className={connectionStatus === 'Connected' ? 'text-green-500' : 'text-gray-600'} />
                  RK Softphone
              </div>
              <div className={`text-xs px-2 py-1 rounded-full border ${status === 'In Call' ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-gray-600 text-gray-400'}`}>
                  {status}
              </div>
          </div>

          {/* Screen Display */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 relative">
               <div className="text-center mb-8 w-full px-8">
                   {status === 'In Call' || status === 'Calling...' ? (
                       <>
                        <h2 className="text-2xl font-bold text-white mb-2">{number || incomingCallInfo?.number}</h2>
                        <div className="text-sm text-green-400 animate-pulse">
                            {status === 'Calling...' ? 'Dialing...' : 'Connected'}
                        </div>
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
               {(showKeypad && status !== 'Ringing' && status !== 'In Call' && status !== 'Calling...') && (
                   <div className="grid grid-cols-3 gap-6 mb-8">
                       {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map((k) => (
                           <button 
                            key={k} 
                            onClick={() => setNumber(prev => prev + k.toString())}
                            className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 text-2xl font-medium text-white transition-colors flex items-center justify-center shadow-lg active:scale-95"
                           >
                               {k}
                           </button>
                       ))}
                   </div>
               )}
          </div>

          {/* Controls */}
          <div className="p-8 bg-gray-900 border-t border-gray-800">
              <div className="grid grid-cols-4 gap-4 mb-6">
                  <button onClick={() => session?.toggleMuteAudio()} className={`flex flex-col items-center gap-1 ${isMuted ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                      <div className={`p-3 rounded-full ${isMuted ? 'bg-white text-black' : 'bg-gray-800'}`}><MicOff size={20}/></div>
                      <span className="text-[10px]">Mute</span>
                  </button>
                  <button onClick={() => setShowKeypad(!showKeypad)} className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300">
                      <div className="p-3 rounded-full bg-gray-800"><GripHorizontal size={20}/></div>
                      <span className="text-[10px]">Keypad</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 text-gray-500">
                       <div className="p-3 rounded-full bg-gray-800"><Circle size={20} /></div>
                       <span className="text-[10px]">Rec</span>
                  </button>
                  <button onClick={() => isOnHold ? session?.unhold() : session?.hold()} className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300">
                       <div className="p-3 rounded-full bg-gray-800">{isOnHold ? <Play size={20}/> : <Pause size={20}/>}</div>
                       <span className="text-[10px]">Hold</span>
                  </button>
              </div>

              <div className="flex justify-center">
                  {status === 'In Call' || status === 'Calling...' ? (
                      <button onClick={handleHangup} className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl transition-transform active:scale-95">
                          <PhoneOff size={32} />
                      </button>
                  ) : (
                      <button onClick={handleCall} className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-transform active:scale-95 ${connectionStatus === 'Connected' ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 cursor-not-allowed'}`}>
                          <Phone size={32} />
                      </button>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};