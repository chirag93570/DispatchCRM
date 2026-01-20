import React, { useEffect, useState } from 'react';
import { tmsService } from '../tmsService';
import { Load } from '../types';
import { MapPin, Calendar, DollarSign, Package, Plus } from 'lucide-react';

const LoadBoard: React.FC = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await tmsService.getLoads();
    setLoads(data);
    setLoading(false);
  };

  const handleAddLoad = async () => {
    // Simple prompts for now - we will upgrade to a form next
    const cust = prompt("Customer Name:");
    if (!cust) return;
    const rate = prompt("Rate ($):");
    const origin = prompt("Pickup Location:");
    const dest = prompt("Delivery Location:");

    await tmsService.addLoad({
      customer_name: cust,
      rate: rate ? parseFloat(rate) : 0,
      notes: `${origin} -> ${dest}`,
      status: 'Pending'
    });
    loadData();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Load Board</h1>
          <p className="text-gray-400 text-sm">Active Shipments & Orders</p>
        </div>
        <button onClick={handleAddLoad} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Load
        </button>
      </div>

      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-950 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Customer</div>
          <div className="col-span-4">Route</div>
          <div className="col-span-2">Dates</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-1 text-center">Status</div>
        </div>

        {/* Load Rows */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading loads...</div>
          ) : loads.length === 0 ? (
            <div className="p-12 text-center text-gray-600">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No active loads</p>
            </div>
          ) : (
            loads.map(load => (
              <div key={load.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors items-center text-sm text-gray-300">
                <div className="col-span-3 font-medium text-white truncate">{load.customer_name}</div>
                <div className="col-span-4 flex items-center gap-2 text-gray-400">
                  <MapPin className="w-3 h-3 text-primary-500" />
                  <span className="truncate">{load.notes || 'No route details'}</span>
                </div>
                <div className="col-span-2 flex flex-col text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {load.pickup_date || 'TBD'}</span>
                </div>
                <div className="col-span-2 text-right font-mono text-green-400">
                  ${load.rate?.toLocaleString() ?? '0'}
                </div>
                <div className="col-span-1 text-center">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                    load.status === 'Pending' ? 'border-yellow-900 bg-yellow-900/20 text-yellow-500' :
                    load.status === 'Dispatched' ? 'border-blue-900 bg-blue-900/20 text-blue-500' :
                    'border-green-900 bg-green-900/20 text-green-500'
                  }`}>
                    {load.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadBoard;