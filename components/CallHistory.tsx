import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Phone, Clock, Calendar, Search, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';

const CallHistory: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (data) setLogs(data);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col p-6 bg-gray-950 overflow-hidden">
      <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
        <Phone className="text-primary-500" /> Call History
      </h2>

      <div className="bg-gray-900 border border-gray-800 rounded-lg flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-850 text-xs text-gray-500 uppercase font-medium sticky top-0">
              <tr>
                <th className="p-4 border-b border-gray-800">Date & Time</th>
                <th className="p-4 border-b border-gray-800">Phone Number</th>
                <th className="p-4 border-b border-gray-800">Duration</th>
                <th className="p-4 border-b border-gray-800">Outcome</th>
                <th className="p-4 border-b border-gray-800">Recording</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="p-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-500" />
                        {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-sm text-primary-400">{log.phone_number}</td>
                  <td className="p-4 text-sm text-gray-400">
                      {log.duration_seconds > 0 ? `${log.duration_seconds}s` : '-'}
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                        log.outcome === 'Completed' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                    }`}>
                        {log.outcome}
                    </span>
                  </td>
                  <td className="p-4">
                      {log.recording_url ? (
                          <div className="flex items-center gap-2">
                              <audio 
                                controls 
                                src={log.recording_url} 
                                className="h-8 w-48 rounded-full bg-gray-100" 
                                onPlay={() => setPlayingId(log.id)}
                              />
                          </div>
                      ) : (
                          <span className="text-xs text-gray-600 italic">No Rec</span>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && !loading && (
              <div className="p-10 text-center text-gray-500">No call history found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallHistory;