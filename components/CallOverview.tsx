import React from 'react';
import { DashboardStats } from '../types';
import { PhoneCall, CheckCircle, Clock, Percent, PhoneMissed, Voicemail } from 'lucide-react';

interface Props {
  stats: DashboardStats;
}

const StatCard = ({ label, value, icon: Icon, colorClass, subtext }: any) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex items-center justify-between shadow-sm">
    <div>
      <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{label}</div>
      <div className="text-3xl font-bold text-gray-100 mt-2">{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
    <div className={`p-4 rounded-full ${colorClass} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

const CallOverview: React.FC<Props> = ({ stats }) => {
    return (
        <div className="h-full overflow-y-auto p-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-8">Telephony & Call Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard 
                    label="Calls Today" 
                    value={stats.totalCallsToday} 
                    icon={PhoneCall} 
                    colorClass="bg-blue-500" 
                    subtext="Outbound & Inbound"
                />
                <StatCard 
                    label="Avg Talk Time" 
                    value={`${stats.avgTalkTime}s`} 
                    icon={Clock} 
                    colorClass="bg-purple-500"
                    subtext="Target: 120s" 
                />
                <StatCard 
                    label="Conversion Rate" 
                    value={`${stats.totalCallsToday > 0 ? Math.round((stats.interestedLeads / stats.totalCallsToday) * 100) : 0}%`} 
                    icon={Percent} 
                    colorClass="bg-green-500" 
                    subtext="Interested / Total Calls"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-200 mb-4">Call Outcomes Breakdown</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 flex items-center gap-2"><CheckCircle size={14}/> Interested</span>
                            <span className="font-mono text-green-400">{stats.interestedLeads}</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full" style={{width: `${(stats.interestedLeads/stats.totalCallsToday)*100}%`}}></div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-400 flex items-center gap-2"><Voicemail size={14}/> Voicemail / Retry</span>
                            <span className="font-mono text-yellow-400">{stats.retryQueue}</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-yellow-500 h-full" style={{width: `${(stats.retryQueue/stats.totalCallsToday)*100}%`}}></div>
                        </div>

                         <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-400 flex items-center gap-2"><PhoneMissed size={14}/> Not Interested/DNC</span>
                            <span className="font-mono text-red-400">{stats.dncCount}</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full" style={{width: `${(stats.dncCount/stats.totalCallsToday)*100}%`}}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-200 mb-4">Agent Activity</h3>
                    <div className="flex items-center gap-4 mb-4 bg-gray-800/50 p-3 rounded">
                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center font-bold">CS</div>
                        <div>
                            <div className="font-medium text-white">Chirag Sharma</div>
                            <div className="text-xs text-gray-500">Active • Extension 101</div>
                        </div>
                        <div className="ml-auto text-right">
                            <div className="text-xl font-bold text-white">{stats.totalCallsToday}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Calls</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallOverview;
