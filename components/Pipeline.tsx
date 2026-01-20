import React, { useEffect, useState } from 'react';
import { Opportunity, SalesStage } from '../types';
import { leadService } from '../services/leadService';
import { DollarSign, Calendar, User, TrendingUp, AlertCircle, Plus, X, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabase';

const Pipeline: React.FC = () => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        loadOpportunities();
    }, []);

    const loadOpportunities = async () => {
        const data = await leadService.getOpportunities();
        setOpportunities(data);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this deal?")) {
            await supabase.from('opportunities').delete().eq('id', id);
            loadOpportunities();
        }
    };

    const stages = Object.values(SalesStage);

    const handleDragStart = (id: string) => {
        setDraggedId(id);
    };

    const handleDrop = async (stage: SalesStage) => {
        if (!draggedId) return;
        
        // Optimistic update
        const updated = opportunities.map(o => 
            o.id === draggedId ? { ...o, stage } : o
        );
        setOpportunities(updated);
        setDraggedId(null);

        // API Call
        try {
            await leadService.updateOpportunityStage(draggedId, stage);
        } catch (e) {
            console.error("Failed to move stage", e);
            loadOpportunities(); // Revert on fail
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const getStageColor = (stage: SalesStage) => {
        switch(stage) {
            case SalesStage.PROSPECTING: return 'border-gray-500';
            case SalesStage.QUALIFICATION: return 'border-blue-500';
            case SalesStage.DISCOVERY: return 'border-indigo-500';
            case SalesStage.PROPOSAL: return 'border-purple-500';
            case SalesStage.NEGOTIATION: return 'border-orange-500';
            case SalesStage.WON: return 'border-green-500';
            case SalesStage.LOST: return 'border-red-500';
            default: return 'border-gray-500';
        }
    };

    const totalPipelineValue = opportunities.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden bg-gray-950 text-gray-100 relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="text-primary-500" /> Sales Pipeline
                    </h2>
                    <p className="text-gray-500 text-sm">Drag deals to update stage</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-gray-900 px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-4">
                        <div>
                            <div className="text-xs text-gray-500 uppercase">Total Value</div>
                            <div className="text-lg font-bold text-white">${totalPipelineValue.toLocaleString()}</div>
                        </div>
                        <div className="h-8 w-px bg-gray-800"></div>
                        <div>
                             <div className="text-xs text-gray-500 uppercase">Deals</div>
                             <div className="text-lg font-bold text-white">{opportunities.length}</div>
                        </div>
                    </div>
                    {/* NEW BUTTON */}
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                    >
                        <Plus size={20} /> New Deal
                    </button>
                </div>
            </div>
            
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
                {stages.map(stage => {
                    const stageOpps = opportunities.filter(o => o.stage === stage);
                    const stageValue = stageOpps.reduce((acc, curr) => acc + curr.value, 0);
                    const borderColor = getStageColor(stage);

                    return (
                        <div 
                            key={stage} 
                            className="min-w-[320px] w-80 flex flex-col bg-gray-900/50 border border-gray-800 rounded-lg h-full transition-colors hover:bg-gray-900/80"
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(stage)}
                        >
                            <div className={`p-4 border-t-4 ${borderColor} bg-gray-900 rounded-t-lg shadow-sm z-10 sticky top-0`}>
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-semibold text-gray-200 text-sm uppercase tracking-wide">{stage}</h3>
                                    <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">{stageOpps.length}</span>
                                </div>
                                <div className="text-xs text-gray-500 font-medium">
                                    ${stageValue.toLocaleString()} estimated
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                {stageOpps.map(opp => (
                                    <div 
                                        key={opp.id} 
                                        draggable
                                        onDragStart={() => handleDragStart(opp.id)}
                                        className="bg-gray-800 border border-gray-700 p-4 rounded shadow-sm hover:border-gray-500 cursor-grab active:cursor-grabbing transition-all hover:-translate-y-1 hover:shadow-md group relative"
                                    >
                                        {/* DELETE BUTTON ON CARD */}
                                        <button 
                                            onClick={(e) => handleDelete(opp.id, e)}
                                            className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>

                                        <div className="font-bold text-white mb-1 pr-6">{opp.title}</div>
                                        <div className="text-sm text-gray-400 mb-3">{opp.companyName}</div>
                                        
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-green-400 font-mono font-medium">${opp.value.toLocaleString()}</span>
                                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{opp.probability}% Prob.</span>
                                        </div>

                                        {opp.nextAction && (
                                            <div className="flex items-center gap-1.5 text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded mb-3">
                                                <AlertCircle size={12} />
                                                Next: {opp.nextAction}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center border-t border-gray-700 pt-2 mt-2">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <User size={12} /> {opp.owner ? opp.owner.split(' ')[0] : 'Agent'}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Calendar size={12} /> {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '-'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {stageOpps.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-gray-600 opacity-50">
                                        <div className="w-12 h-12 border-2 border-dashed border-gray-600 rounded-lg mb-2"></div>
                                        <div className="text-xs italic">Drop deals here</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Deal Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Add New Deal</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <AddDealForm 
                            onClose={() => setShowAddModal(false)} 
                            onSave={async (deal) => {
                                await leadService.addOpportunity(deal);
                                await loadOpportunities();
                                setShowAddModal(false);
                            }} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const AddDealForm = ({ onClose, onSave }: { onClose: () => void, onSave: (deal: any) => Promise<void> }) => {
    const [form, setForm] = useState({
        title: '',
        companyName: '',
        value: 0,
        nextAction: '',
        expectedCloseDate: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave(form);
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Deal Title</label>
                <input required className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none" 
                    value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Q4 Logistics Contract" />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Company Name</label>
                <input required className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none" 
                    value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Value ($)</label>
                    <input type="number" required className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none" 
                        value={form.value} onChange={e => setForm({...form, value: parseInt(e.target.value)})} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Est. Close Date</label>
                    <input type="date" required className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none" 
                        value={form.expectedCloseDate} onChange={e => setForm({...form, expectedCloseDate: e.target.value})} />
                </div>
            </div>
             <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Next Action</label>
                <input className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none" 
                    value={form.nextAction} onChange={e => setForm({...form, nextAction: e.target.value})} placeholder="e.g. Send Proposal" />
            </div>
            <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded text-gray-400 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 rounded text-white font-medium hover:bg-primary-500 disabled:opacity-50">
                    {loading ? 'Saving...' : 'Create Deal'}
                </button>
            </div>
        </form>
    );
};

export default Pipeline;