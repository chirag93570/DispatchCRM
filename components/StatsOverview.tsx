import React from 'react';
import { DashboardStats } from '../types';
import { PhoneCall, CheckCircle, RefreshCcw, Database, List, Ban } from 'lucide-react';

interface Props {
  stats: DashboardStats;
}

const StatCard = ({ label, value, icon: Icon, colorClass }: { label: string, value: number, icon: any, colorClass: string }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between shadow-sm min-w-[150px]">
    <div>
      <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-gray-100 mt-1">{value}</div>
    </div>
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-10`}>
      <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

const StatsOverview: React.FC<Props> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
      <StatCard 
        label="Total Leads" 
        value={stats.totalLeads} 
        icon={Database} 
        colorClass="bg-purple-500" 
      />
      <StatCard 
        label="In Queue" 
        value={stats.leadsInQueue} 
        icon={List} 
        colorClass="bg-blue-500" 
      />
      <StatCard 
        label="Calls Today" 
        value={stats.totalCallsToday} 
        icon={PhoneCall} 
        colorClass="bg-indigo-500" 
      />
       <StatCard 
        label="Retry" 
        value={stats.retryQueue} 
        icon={RefreshCcw} 
        colorClass="bg-yellow-500" 
      />
      <StatCard 
        label="Interested" 
        value={stats.interestedLeads} 
        icon={CheckCircle} 
        colorClass="bg-green-500" 
      />
      <StatCard 
        label="DNC" 
        value={stats.dncCount} 
        icon={Ban} 
        colorClass="bg-red-500" 
      />
    </div>
  );
};

export default StatsOverview;