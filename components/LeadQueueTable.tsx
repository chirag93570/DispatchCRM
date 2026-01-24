import React, { useMemo, useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { Search, Filter, ArrowUpDown, ChevronUp, ChevronDown, Phone, Trash2, Folder, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { leadService } from '../services/leadService';

interface Props {
  leads: Lead[];
  onLeadSelect: (lead: Lead) => void;
  onQuickCall: (lead: Lead) => void;
  onRefresh: () => void;
  activeLeadId?: string;
}

type SortField = 'serialNumber' | 'companyName' | 'status' | 'lastCallTime';
type SortDirection = 'asc' | 'desc';

const LeadQueueTable: React.FC<Props> = ({ leads, onLeadSelect, onQuickCall, onRefresh, activeLeadId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('serialNumber');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sources = useMemo(() => {
      const unique = new Set(leads.map(l => l.source || 'Upload').filter(Boolean));
      return Array.from(unique);
  }, [leads]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, leadId: string) => {
      e.stopPropagation(); 
      const newStatus = e.target.value as LeadStatus;
      await leadService.updateLeadStatus(leadId, newStatus);
      onRefresh();
  };

  const filteredLeads = useMemo(() => {
    let result = leads.filter(lead => {
      const matchesSearch = 
        lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.mcNumber && lead.mcNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.dotNumber && lead.dotNumber.includes(searchTerm)) ||
        lead.phoneNumber.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'ALL' || (lead.source || 'Upload') === sourceFilter;
      
      return matchesSearch && matchesStatus && matchesSource;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'serialNumber': comparison = a.serialNumber - b.serialNumber; break;
        case 'companyName': comparison = a.companyName.localeCompare(b.companyName); break;
        case 'status': comparison = String(a.status).localeCompare(String(b.status)); break;
        case 'lastCallTime':
          const tA = a.lastCallTime ? new Date(a.lastCallTime).getTime() : 0;
          const tB = b.lastCallTime ? new Date(b.lastCallTime).getTime() : 0;
          comparison = tA - tB;
          break;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [leads, searchTerm, statusFilter, sourceFilter, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-primary-400" /> : <ChevronDown className="w-3 h-3 text-primary-400" />;
  };

  // Selection Logic
  const toggleSelectAll = () => {
      if (selectedIds.size === filteredLeads.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(filteredLeads.map(l => l.id)));
      }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
      if (!window.confirm(`Delete ${selectedIds.size} selected leads?`)) return;
      await leadService.deleteLeads(Array.from(selectedIds));
      setSelectedIds(new Set());
      onRefresh();
  };

  const handleDeleteList = async () => {
      if (sourceFilter === 'ALL') return;
      if (!window.confirm(`PERMANENTLY DELETE ALL leads from list "${sourceFilter}"?`)) return;
      await leadService.deleteLeadsBySource(sourceFilter);
      setSourceFilter('ALL');
      onRefresh();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-lg">
      <div className="p-4 border-b border-gray-800 flex flex-wrap gap-4 items-center justify-between bg-gray-850">
        
        <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <span className="w-2 h-6 bg-primary-600 rounded-sm inline-block"></span>
            Live Lead Queue
            </h3>
            
            {/* BULK ACTIONS */}
            {selectedIds.size > 0 && (
                <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-1.5 bg-red-900/50 text-red-400 border border-red-800 rounded hover:bg-red-900 transition-colors text-xs font-bold animate-in fade-in">
                    <Trash2 size={14} /> Delete ({selectedIds.size})
                </button>
            )}

            {/* DELETE LIST ACTION */}
            {sourceFilter !== 'ALL' && (
                <button onClick={handleDeleteList} className="flex items-center gap-2 px-3 py-1.5 bg-red-900/50 text-red-400 border border-red-800 rounded hover:bg-red-900 transition-colors text-xs font-bold">
                    <Trash2 size={14} /> Delete List "{sourceFilter}"
                </button>
            )}
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="relative">
             <select 
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="pl-8 pr-8 py-1.5 text-sm bg-gray-950 border border-gray-700 rounded-md focus:outline-none focus:border-primary-600 text-gray-200 appearance-none cursor-pointer w-40 truncate"
            >
              <option value="ALL">All Lists</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Folder className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm bg-gray-950 border border-gray-700 rounded-md focus:outline-none focus:border-primary-600 text-gray-200 w-48 transition-colors"
            />
          </div>
          
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-1.5 text-sm bg-gray-950 border border-gray-700 rounded-md focus:outline-none focus:border-primary-600 text-gray-200 appearance-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              {Object.values(LeadStatus).map(s => <option key={s} value={s}>{String(s)}</option>)}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-950 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 w-10 border-b border-gray-800">
                  <button onClick={toggleSelectAll} className="text-gray-500 hover:text-white">
                      {selectedIds.size > 0 && selectedIds.size === filteredLeads.length ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
              </th>
              <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-800 cursor-pointer hover:bg-gray-900" onClick={() => handleSort('serialNumber')}>
                <div className="flex items-center gap-1"># <SortIcon field="serialNumber" /></div>
              </th>
              <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-800 cursor-pointer hover:bg-gray-900" onClick={() => handleSort('companyName')}>
                <div className="flex items-center gap-1">Company <SortIcon field="companyName" /></div>
              </th>
              <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-800">DOT / MC</th>
              <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-800">Contact</th>
              <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-800 cursor-pointer hover:bg-gray-900" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
              </th>
              <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-800 cursor-pointer hover:bg-gray-900" onClick={() => handleSort('lastCallTime')}>
                 <div className="flex items-center gap-1">Last Call <SortIcon field="lastCallTime" /></div>
              </th>
              <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-800">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredLeads.map((lead, index) => (
              <tr 
                key={lead.id} 
                className={`hover:bg-gray-800/50 transition-colors cursor-pointer group ${activeLeadId === lead.id ? 'bg-primary-600/10 hover:bg-primary-600/20 border-l-2 border-primary-500' : ''}`}
                onClick={() => onLeadSelect(lead)}
              >
                <td className="p-3" onClick={(e) => toggleSelectRow(lead.id, e)}>
                    <div className={`cursor-pointer ${selectedIds.has(lead.id) ? 'text-primary-500' : 'text-gray-600'}`}>
                        {selectedIds.has(lead.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </div>
                </td>
                
                {/* FIXED: Display visual index (1, 2, 3...) instead of database ID (4501...) */}
                <td className="p-3 text-sm text-gray-500 font-mono">
                    {index + 1}
                </td>

                <td className="p-3">
                  <div className="font-medium text-gray-200">{String(lead.companyName)}</div>
                  <div className="text-xs text-gray-500 flex gap-1 items-center">
                      <span>{String(lead.state || 'N/A')}, {String(lead.truckCount || 0)} Trucks</span>
                      {lead.source && <span className="bg-gray-800 px-1 rounded text-[10px] text-gray-400">{lead.source}</span>}
                  </div>
                </td>
                <td className="p-3 text-sm text-gray-400 font-mono">
                    {lead.dotNumber ? <span title="DOT Number">DOT:{lead.dotNumber}</span> : (lead.mcNumber || '-')}
                </td>
                <td className="p-3">
                  <div className="text-sm text-gray-300">{String(lead.phoneNumber)}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[150px]">{String(lead.email)}</div>
                </td>
                <td className="p-3" onClick={e => e.stopPropagation()}>
                    <select 
                        value={lead.status}
                        onChange={(e) => handleStatusChange(e, lead.id)}
                        className="bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded px-2 py-1 outline-none focus:border-primary-500 cursor-pointer"
                    >
                        {Object.values(LeadStatus).map(s => <option key={s} value={s}>{String(s)}</option>)}
                    </select>
                </td>
                <td className="p-3 text-sm text-gray-400">
                  {lead.lastCallTime ? format(new Date(lead.lastCallTime), 'MM/dd HH:mm') : '-'}
                </td>
                <td className="p-3 flex items-center gap-2">
                  <button 
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded font-medium transition-colors shadow-sm active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickCall(lead);
                    }}
                  >
                    <Phone size={12} fill="white" /> Call
                  </button>
                  <button 
                    className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-gray-800 transition-colors"
                    onClick={async (e) => {
                        e.stopPropagation();
                        if(window.confirm('Are you sure you want to delete this lead?')) {
                            await leadService.deleteLead(lead.id);
                            onRefresh();
                        }
                    }}
                  >
                      <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-2 border-t border-gray-800 bg-gray-950 text-xs text-gray-500 text-right">
        Showing {filteredLeads.length} of {leads.length} leads
      </div>
    </div>
  );
};

export default LeadQueueTable;