import React, { useEffect, useState } from 'react';
import { Opportunity, SalesStage } from '../types';
import { leadService } from '../services/leadService';
import { DollarSign, MoreHorizontal, Calendar, User, TrendingUp, AlertCircle } from 'lucide-react';

const Pipeline: React.FC = () => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    useEffect(() => {
        loadOpportunities();
    }, []);

    const loadOpportunities = async () => {
        const data = await leadService.getOpportunities();
        setOpportunities(data);
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
        <div className="h-full flex flex-col p-6 overflow-hidden bg-gray-950 text-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="text-primary-500" /> Sales Pipeline
                    </h2>
                    <p className="text-gray-500 text-sm">Drag deals to update stage</p>
                </div>
                <div className="flex items-center gap-4 bg-gray-900 px-4 py-2 rounded-lg border border-gray-800">
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
                                        className="bg-gray-800 border border-gray-700 p-4 rounded shadow-sm hover:border-gray-500 cursor-grab active:cursor-grabbing transition-all hover:-translate-y-1 hover:shadow-md"
                                    >
                                        <div className="font-bold text-white mb-1">{opp.title}</div>
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
                                                <User size={12} /> {opp.owner.split(' ')[0]}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Calendar size={12} /> {new Date(opp.expectedCloseDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
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
        </div>
    );
};

export default Pipeline;
