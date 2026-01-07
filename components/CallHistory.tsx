import React, { useEffect, useState } from 'react';
import { leadService } from '../services/leadService';
import { CallLog } from '../types';
import { format } from 'date-fns';
import { PhoneOutgoing, Clock, Play, Search, Download } from 'lucide-react';

const CallHistory: React.FC = () => {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'LOGS' | 'RECORDINGS'>('LOGS');
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const history = await leadService.getCallHistory();
      setLogs(history);
      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
      l.phoneNumber.includes(search) || 
      l.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const togglePlay = (id: string, url?: string) => {
      if (!url) return;
      if (playingId === id) {
          setPlayingId(null);
          // In real app, pause audio
      } else {
          setPlayingId(id);
          // In real app, play audio
      }
  };

  if (isLoading) return <div className="text-center text-gray-500 mt-10">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-gray-900 m-6 rounded-lg border border-gray-800 overflow-hidden">
      {/* Header & Tabs */}
      <div className="p-4 border-b border-gray-800 bg-gray-850 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          {view === 'LOGS' ? <PhoneOutgoing className="w-5 h-5 text-primary-500" /> : <Clock className="w-5 h-5 text-primary-500" />}
          {view === 'LOGS' ? 'Call Logs' : 'Call Recordings'}
        </h3>
        <div className="flex bg-gray-900 rounded p-1 border border-gray-800">
            <button 
                onClick={() => setView('LOGS')} 
                className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${view === 'LOGS' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Logs
            </button>
            <button 
                onClick={() => setView('RECORDINGS')} 
                className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${view === 'RECORDINGS' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Recordings
            </button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-800 bg-gray-900 flex gap-2">
          <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search by number or company..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded py-2 pl-9 pr-4 text-sm text-gray-200 outline-none focus:border-primary-600"
              />
          </div>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-950 sticky top-0">
            <tr>
              <th className="p-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-800">Date/Time</th>
              <th className="p-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-800">Company</th>
              <th className="p-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-800">Phone</th>
              <th className="p-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-800">Outcome</th>
              <th className="p-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-800">Duration</th>
              {view === 'RECORDINGS' && <th className="p-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-800">Player</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-gray-800/50">
                <td className="p-3 text-sm text-gray-400">
                  {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                </td>
                <td className="p-3 font-medium text-gray-200">{log.companyName}</td>
                <td className="p-3 text-sm text-gray-400 font-mono">{log.phoneNumber}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">{log.outcome}</span>
                </td>
                <td className="p-3 text-sm text-gray-400">
                  {Math.floor(log.durationSeconds / 60)}m {log.durationSeconds % 60}s
                </td>
                {view === 'RECORDINGS' && (
                    <td className="p-3">
                        {log.recordingUrl ? (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => togglePlay(log.id, log.recordingUrl)}
                                    className={`p-2 rounded-full ${playingId === log.id ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                >
                                    <Play size={14} fill="currentColor" />
                                </button>
                                <button className="text-gray-500 hover:text-gray-300">
                                    <Download size={14} />
                                </button>
                                {playingId === log.id && (
                                    <div className="w-24 h-1 bg-gray-700 rounded overflow-hidden">
                                        <div className="h-full bg-primary-500 animate-pulse w-2/3"></div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-gray-600 italic">No Audio</span>
                        )}
                    </td>
                )}
              </tr>
            ))}
            {filteredLogs.length === 0 && (
                <tr>
                    <td colSpan={view === 'RECORDINGS' ? 6 : 5} className="p-8 text-center text-gray-500">No records found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CallHistory;
