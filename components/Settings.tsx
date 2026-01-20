import React, { useState, useEffect } from 'react';
import { User, Sun, Moon, Shield, Phone, Save, Key, Link2, Wifi, WifiOff, Mail } from 'lucide-react';

const Settings: React.FC = () => {
  const [sipConfig, setSipConfig] = useState({
    username: '',
    password: '',
    displayName: 'Dispatcher',
    autoRecord: false
  });
  const [isConnected, setIsConnected] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('sip_config');
    const connectionState = localStorage.getItem('sip_connected');
    if (saved) {
      setSipConfig(JSON.parse(saved));
    }
    if (connectionState === 'true') {
        setIsConnected(true);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('sip_config', JSON.stringify(sipConfig));
    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const toggleConnection = () => {
      if (isConnected) {
          setIsConnected(false);
          localStorage.setItem('sip_connected', 'false');
      } else {
          // Simulate connection validation
          if (!sipConfig.username || !sipConfig.password) {
              alert("Please enter SIP credentials");
              return;
          }
          handleSave();
          setIsConnected(true);
          localStorage.setItem('sip_connected', 'true');
      }
  };

  return (
    <div className="max-w-4xl mx-auto m-6 space-y-6 overflow-y-auto pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-100">Settings</h2>
        {saveStatus && <span className="text-green-400 text-sm animate-pulse">{saveStatus}</span>}
      </div>
      
      {/* Voice / SIP Connection */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary-500" />
            SIP Connection (Telnyx)
        </h3>
        
        <div className="space-y-4">
            <div className={`p-4 rounded-lg border flex items-center justify-between ${isConnected ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-950 border-gray-700'}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isConnected ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-500'}`}>
                        {isConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
                    </div>
                    <div>
                        <div className={`font-bold ${isConnected ? 'text-green-400' : 'text-gray-400'}`}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </div>
                        <div className="text-xs text-gray-500">
                            {isConnected ? 'Ready to make and receive calls' : 'Connect to enable dialer'}
                        </div>
                    </div>
                </div>
                <button 
                    onClick={toggleConnection}
                    className={`px-4 py-2 rounded font-medium text-sm transition-colors ${isConnected ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-600 text-white hover:bg-green-500'}`}
                >
                    {isConnected ? 'Disconnect' : 'Connect'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-100 transition-opacity">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">SIP Username</label>
                    <input 
                        type="text" 
                        disabled={isConnected}
                        placeholder="e.g. user_123"
                        value={sipConfig.username}
                        onChange={(e) => setSipConfig({...sipConfig, username: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none disabled:opacity-50" 
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">SIP Password</label>
                    <input 
                        type="password" 
                        disabled={isConnected}
                        placeholder="••••••••"
                        value={sipConfig.password}
                        onChange={(e) => setSipConfig({...sipConfig, password: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none disabled:opacity-50" 
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                    <input 
                        type="text" 
                        value={sipConfig.displayName}
                        onChange={(e) => setSipConfig({...sipConfig, displayName: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none" 
                    />
                </div>
                <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={sipConfig.autoRecord}
                            onChange={(e) => setSipConfig({...sipConfig, autoRecord: e.target.checked})}
                            className="w-4 h-4 rounded border-gray-700 bg-gray-950 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-300">Auto-record outgoing calls</span>
                    </label>
                </div>
            </div>

            <div className="pt-2 border-t border-gray-800 flex justify-end">
                <button onClick={handleSave} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    <Save size={14} /> Update Defaults
                </button>
            </div>
        </div>
      </div>

      {/* Email Integration */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary-500" />
            Email Integration
        </h3>
        <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-gray-950 rounded border border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-200">Gmail</div>
                        <div className="text-xs text-gray-500">Connect your Google Workspace</div>
                    </div>
                </div>
                <button className="px-3 py-1.5 border border-gray-600 rounded text-sm hover:bg-gray-800 transition-colors">Connect</button>
             </div>
             
             <div className="flex items-center justify-between p-4 bg-gray-950 rounded border border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                        Z
                    </div>
                    <div>
                        <div className="font-medium text-gray-200">Zoho Mail</div>
                        <div className="text-xs text-gray-500">Connect Zoho CRM Email</div>
                    </div>
                </div>
                <button className="px-3 py-1.5 border border-gray-600 rounded text-sm hover:bg-gray-800 transition-colors">Connect</button>
             </div>
        </div>
      </div>

    </div>
  );
};

export default Settings;
