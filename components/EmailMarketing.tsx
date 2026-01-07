import React, { useState } from 'react';
import { Mail, Send, Clock, Plus, BarChart2, Users, Settings, PenTool, Layout, FileText, CheckCircle, AlertCircle } from 'lucide-react';

type EmailView = 'DASHBOARD' | 'CAMPAIGNS' | 'TEMPLATES' | 'SETTINGS';

const EmailMarketing: React.FC = () => {
    const [view, setView] = useState<EmailView>('DASHBOARD');
    const [gmailConnected, setGmailConnected] = useState(false);
    const [zohoConnected, setZohoConnected] = useState(false);

    const renderDashboard = () => (
        <div className="space-y-6">
             <div className="grid grid-cols-3 gap-6">
                 <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg">
                     <div className="text-gray-500 text-sm font-medium uppercase mb-1">Delivered</div>
                     <div className="text-3xl font-bold text-white">1,240</div>
                     <div className="text-green-400 text-xs mt-2 flex items-center gap-1">
                         <BarChart2 size={12} /> 98.5% Rate
                     </div>
                 </div>
                 <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg">
                     <div className="text-gray-500 text-sm font-medium uppercase mb-1">Open Rate</div>
                     <div className="text-3xl font-bold text-white">42.8%</div>
                     <div className="text-gray-500 text-xs mt-2">Target: 30%</div>
                 </div>
                 <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg">
                     <div className="text-gray-500 text-sm font-medium uppercase mb-1">Engaged Leads</div>
                     <div className="text-3xl font-bold text-white">85</div>
                     <div className="text-primary-400 text-xs mt-2 cursor-pointer hover:underline">View List</div>
                 </div>
             </div>
             
             <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                 <h3 className="text-lg font-medium text-gray-200 mb-4">Account Health</h3>
                 <div className="space-y-4">
                     <div className="flex items-center justify-between p-3 bg-gray-950 rounded border border-gray-800">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">Z</div>
                             <div>
                                 <div className="font-medium text-gray-200">Zoho Mail</div>
                                 <div className="text-xs text-gray-500">{zohoConnected ? 'Connected • dispatch@rkdispatch.com' : 'Not Connected'}</div>
                             </div>
                         </div>
                         <div className={`text-xs px-2 py-1 rounded ${zohoConnected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                             {zohoConnected ? 'Healthy' : 'Disconnected'}
                         </div>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-gray-950 rounded border border-gray-800">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-white rounded flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" className="w-5" /></div>
                             <div>
                                 <div className="font-medium text-gray-200">Gmail</div>
                                 <div className="text-xs text-gray-500">{gmailConnected ? 'Connected • sales@rkdispatch.com' : 'Not Connected'}</div>
                             </div>
                         </div>
                         <div className={`text-xs px-2 py-1 rounded ${gmailConnected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                             {gmailConnected ? 'Healthy' : 'Disconnected'}
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );

    const renderSettings = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Email Account Connections</h3>
            
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg">
                <h4 className="font-medium text-gray-200 mb-4">Connect Provider</h4>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-700 rounded bg-gray-950">
                        <div className="flex gap-4">
                             <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">Z</div>
                             <div>
                                 <div className="font-bold text-white">Zoho Mail</div>
                                 <p className="text-sm text-gray-400 max-w-sm">Connect via OAuth. Permissions: Send, Read, Sync Folders.</p>
                             </div>
                        </div>
                        <button 
                            onClick={() => setZohoConnected(!zohoConnected)}
                            className={`px-4 py-2 rounded font-medium ${zohoConnected ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-600 text-white'}`}
                        >
                            {zohoConnected ? 'Disconnect' : 'Connect Zoho'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-700 rounded bg-gray-950">
                        <div className="flex gap-4">
                             <div className="w-12 h-12 bg-white rounded flex items-center justify-center border border-gray-700"><img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" className="w-8" /></div>
                             <div>
                                 <div className="font-bold text-white">Gmail / G-Suite</div>
                                 <p className="text-sm text-gray-400 max-w-sm">Connect via Google OAuth. Permissions: Send, Read, Metadata.</p>
                             </div>
                        </div>
                         <button 
                            onClick={() => setGmailConnected(!gmailConnected)}
                            className={`px-4 py-2 rounded font-medium ${gmailConnected ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white text-gray-900'}`}
                        >
                            {gmailConnected ? 'Disconnect' : 'Sign in with Google'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg">
                 <h4 className="font-medium text-gray-200 mb-4">Deliverability Settings</h4>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="text-xs text-gray-500 uppercase">Daily Send Limit</label>
                         <input type="number" className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white" defaultValue={500} />
                     </div>
                     <div>
                         <label className="text-xs text-gray-500 uppercase">Warm-up Ramp Up</label>
                         <select className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white">
                             <option>Conservative (Start 20/day)</option>
                             <option>Aggressive (Start 50/day)</option>
                         </select>
                     </div>
                 </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col overflow-hidden">
             {/* Header */}
             <div className="h-16 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-2">
                    <Mail className="text-primary-500" /> 
                    <span className="font-bold text-lg">Email Marketing Module</span>
                </div>
                <div className="flex bg-gray-950 rounded p-1 border border-gray-800">
                    <button onClick={() => setView('DASHBOARD')} className={`px-3 py-1.5 rounded text-xs font-medium ${view === 'DASHBOARD' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>Dashboard</button>
                    <button onClick={() => setView('CAMPAIGNS')} className={`px-3 py-1.5 rounded text-xs font-medium ${view === 'CAMPAIGNS' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>Campaigns</button>
                    <button onClick={() => setView('TEMPLATES')} className={`px-3 py-1.5 rounded text-xs font-medium ${view === 'TEMPLATES' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>Templates</button>
                    <button onClick={() => setView('SETTINGS')} className={`px-3 py-1.5 rounded text-xs font-medium ${view === 'SETTINGS' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>Settings</button>
                </div>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-6">
                 {view === 'DASHBOARD' && renderDashboard()}
                 {view === 'SETTINGS' && renderSettings()}
                 {view === 'CAMPAIGNS' && (
                     <div className="text-center py-20 text-gray-500">
                         <Layout size={48} className="mx-auto mb-4 opacity-50"/>
                         <h3 className="text-lg font-medium text-gray-300">Campaign Manager</h3>
                         <p className="max-w-md mx-auto mt-2">Create bulk campaigns, select lists, and schedule sends. (Module UI Placeholder)</p>
                         <button className="mt-4 bg-primary-600 text-white px-4 py-2 rounded">Create Campaign</button>
                     </div>
                 )}
                 {view === 'TEMPLATES' && (
                     <div className="grid grid-cols-3 gap-4">
                         {[1,2,3].map(i => (
                             <div key={i} className="bg-gray-900 border border-gray-800 p-4 rounded hover:border-primary-500 cursor-pointer">
                                 <div className="h-32 bg-gray-950 mb-3 rounded flex items-center justify-center text-gray-700">Preview</div>
                                 <div className="font-medium text-gray-200">Sales Follow-up #{i}</div>
                                 <div className="text-xs text-gray-500">Last edited 2 days ago</div>
                             </div>
                         ))}
                         <div className="border-2 border-dashed border-gray-800 rounded flex items-center justify-center text-gray-500 hover:border-gray-600 hover:text-gray-300 cursor-pointer">
                             + New Template
                         </div>
                     </div>
                 )}
             </div>
        </div>
    );
};

export default EmailMarketing;
