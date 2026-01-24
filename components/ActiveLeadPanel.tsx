import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import { Phone, Mail, Clock, MapPin, Truck, Calendar, X, Save, Edit2, Hash } from 'lucide-react';
import { leadService } from '../services/leadService';

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onUpdate: () => void; 
}

export const ActiveLeadPanel: React.FC<Props> = ({ lead, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData(lead);
      setIsEditing(false);
    }
  }, [lead]);

  if (!lead) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
        await leadService.updateLeadDetails(lead.id, formData);
        setIsEditing(false);
        onUpdate(); 
    } catch (e) {
        alert("Failed to save changes");
    } finally {
        setLoading(false);
    }
  };

  const handleQuickStatus = async (status: LeadStatus) => {
      await leadService.updateLeadStatus(lead.id, status);
      onUpdate();
  };

  return (
    <div className="h-full bg-gray-900 border-l border-gray-800 flex flex-col shadow-2xl w-[400px]">
      
      {/* HEADER */}
      <div className="p-6 border-b border-gray-800 flex justify-between items-start bg-gray-850">
        <div className="flex-1">
          {isEditing ? (
            <input 
                className="bg-gray-800 text-white text-xl font-bold p-2 rounded w-full border border-gray-700 focus:border-blue-500 outline-none"
                value={formData.companyName}
                onChange={e => setFormData({...formData, companyName: e.target.value})}
            />
          ) : (
            <h2 className="text-xl font-bold text-white">{lead.companyName}</h2>
          )}
          
          <div className="flex items-center gap-2 mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
                lead.status === 'INTERESTED' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                lead.status === 'DNC' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                'border-gray-700 text-gray-400 bg-gray-800'
              }`}>
                {lead.status}
              </span>
              {lead.source && <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{lead.source}</span>}
          </div>
        </div>
        
        <div className="flex gap-2">
            {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <Edit2 size={20} />
                </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* DISPOSITION BUTTONS (Quick Actions) */}
        <section className="grid grid-cols-3 gap-2">
            <button onClick={() => handleQuickStatus(LeadStatus.INTERESTED)} className="p-2 bg-green-900/30 border border-green-800 text-green-400 rounded hover:bg-green-900/50 text-xs font-medium transition-colors">Interested</button>
            <button onClick={() => handleQuickStatus(LeadStatus.NOT_INTERESTED)} className="p-2 bg-gray-800 border border-gray-700 text-gray-300 rounded hover:bg-gray-700 text-xs font-medium transition-colors">Not Interested</button>
            <button onClick={() => handleQuickStatus(LeadStatus.RETRY)} className="p-2 bg-yellow-900/30 border border-yellow-800 text-yellow-400 rounded hover:bg-yellow-900/50 text-xs font-medium transition-colors">Retry Later</button>
        </section>

        {/* Contact Info Section */}
        <section className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Details</h3>
            
            <div className="space-y-4">
                {/* Phone */}
                <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500">
                        <Phone size={16} />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-gray-500 block">Phone</label>
                        {isEditing ? (
                            <input 
                                className="bg-gray-800 text-white text-sm p-1 rounded w-full border border-gray-700"
                                value={formData.phoneNumber}
                                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                            />
                        ) : (
                            <span className="font-mono text-lg text-white">{lead.phoneNumber}</span>
                        )}
                    </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500">
                        <Mail size={16} />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-gray-500 block">Email</label>
                        {isEditing ? (
                            <input 
                                className="bg-gray-800 text-white text-sm p-1 rounded w-full border border-gray-700"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        ) : (
                            <span className="truncate block max-w-[200px]">{lead.email || 'N/A'}</span>
                        )}
                    </div>
                </div>

                {/* Address */}
                <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500">
                        <MapPin size={16} />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-gray-500 block">Address</label>
                        {isEditing ? (
                            <textarea 
                                className="bg-gray-800 text-white text-sm p-1 rounded w-full border border-gray-700 h-16 resize-none"
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                            />
                        ) : (
                            <span className="text-sm leading-snug">{lead.address || lead.state || 'N/A'}</span>
                        )}
                    </div>
                </div>
            </div>
        </section>

        {/* Operational Info */}
        <section className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Operations</h3>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Truck size={14} />
                        <span className="text-[10px]">Fleet Size</span>
                    </div>
                    {isEditing ? (
                        <input 
                            type="number"
                            className="bg-gray-800 text-white text-lg font-bold p-1 rounded w-full border border-gray-700"
                            value={formData.truckCount}
                            onChange={e => setFormData({...formData, truckCount: parseInt(e.target.value)})}
                        />
                    ) : (
                        <div className="text-xl font-bold text-white">{lead.truckCount}</div>
                    )}
                </div>
                
                <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Hash size={14} />
                        <span className="text-[10px]">DOT Number</span>
                    </div>
                    <div className="text-lg font-medium text-white font-mono">{lead.dotNumber || 'N/A'}</div>
                </div>
            </div>
        </section>

        {/* Last Call Info */}
        <section className="space-y-4 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</h3>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-800">
                 <Clock className="text-gray-500 mt-1" size={16} />
                 <div>
                     <div className="text-sm text-gray-300">Last Interaction</div>
                     <div className="text-xs text-gray-500 mt-1">
                         {lead.lastCallTime ? new Date(lead.lastCallTime).toLocaleString() : 'No calls yet'}
                     </div>
                 </div>
            </div>
        </section>
      </div>

      {/* FOOTER ACTIONS */}
      {isEditing && (
          <div className="p-4 bg-gray-850 border-t border-gray-800 flex gap-4">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium"
              >
                  Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                  {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
              </button>
          </div>
      )}
    </div>
  );
};