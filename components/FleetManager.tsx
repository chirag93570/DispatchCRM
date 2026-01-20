import React, { useEffect, useState } from 'react';
import { tmsService } from '../tmsService';
import { Asset, Driver } from '../types';
import { Truck, Users, Plus, Activity, AlertCircle } from 'lucide-react';

const FleetManager: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assets' | 'drivers'>('assets');

  // Load data when page opens
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [assetsData, driversData] = await Promise.all([
      tmsService.getAssets(),
      tmsService.getDrivers()
    ]);
    setAssets(assetsData);
    setDrivers(driversData);
    setLoading(false);
  };

  // Simple "Add" handlers for now (we will build full modals later)
  const handleAddAsset = async () => {
    const unit = prompt("Enter Unit Number (e.g. 101):");
    if (!unit) return;
    const type = confirm("Is this a Truck? (OK for Truck, Cancel for Trailer)") ? 'Truck' : 'Trailer';
    
    await tmsService.addAsset({
      unit_number: unit,
      type: type,
      status: 'Active'
    });
    loadData(); // Refresh list
  };

  const handleAddDriver = async () => {
    const name = prompt("Enter Driver Name:");
    if (!name) return;
    
    await tmsService.addDriver({
      name: name,
      status: 'Active'
    });
    loadData(); // Refresh list
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Fleet Management</h1>
          <p className="text-gray-400 text-sm">Manage your assets and drivers</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={activeTab === 'assets' ? handleAddAsset : handleAddDriver}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add {activeTab === 'assets' ? 'Asset' : 'Driver'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-800 mb-6">
        <button 
          onClick={() => setActiveTab('assets')}
          className={`pb-3 px-1 flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'assets' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Truck className="w-4 h-4" /> Vehicles & Trailers
        </button>
        <button 
          onClick={() => setActiveTab('drivers')}
          className={`pb-3 px-1 flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'drivers' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Users className="w-4 h-4" /> Drivers
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="text-gray-500">Loading fleet data...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-950 text-gray-500 font-medium border-b border-gray-800">
              <tr>
                {activeTab === 'assets' ? (
                  <>
                    <th className="px-6 py-3">Unit #</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Location</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3">Driver Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">License</th>
                    <th className="px-6 py-3">Contact</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {activeTab === 'assets' ? assets.map(asset => (
                <tr key={asset.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-white">{asset.unit_number}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs border ${asset.type === 'Truck' ? 'border-blue-900 bg-blue-900/20 text-blue-400' : 'border-gray-700 bg-gray-800 text-gray-400'}`}>
                      {asset.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-green-400"><Activity className="w-3 h-3" /> {asset.status}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{asset.current_location || '—'}</td>
                </tr>
              )) : drivers.map(driver => (
                <tr key={driver.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-white">{driver.name}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-green-400"><Activity className="w-3 h-3" /> {driver.status}</span>
                  </td>
                  <td className="px-6 py-4">{driver.license_number || '—'}</td>
                  <td className="px-6 py-4">{driver.phone || '—'}</td>
                </tr>
              ))}

              {/* Empty States */}
              {activeTab === 'assets' && assets.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-600">No assets found. Click "Add Asset" to start.</td></tr>
              )}
              {activeTab === 'drivers' && drivers.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-600">No drivers found. Click "Add Driver" to start.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FleetManager;