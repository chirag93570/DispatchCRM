import React, { useState, useRef } from 'react';
import { X, Upload, Plus, AlertCircle, FileSpreadsheet, Check } from 'lucide-react';
import { Lead } from '../types';
import * as XLSX from 'xlsx';

// --- ADD LEAD MODAL ---
interface AddLeadModalProps {
    onClose: () => void;
    onSave: (lead: Partial<Lead>) => Promise<void>;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        mcNumber: '',
        phoneNumber: '',
        email: '',
        state: '',
        truckCount: 1
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Add New Lead</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Company Name</label>
                        <input required className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none" 
                            value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">MC Number</label>
                            <input required className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none" 
                                value={formData.mcNumber} onChange={e => setFormData({...formData, mcNumber: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Phone</label>
                            <input required className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none" 
                                value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Email</label>
                        <input type="email" className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none" 
                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">State</label>
                            <input className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none" 
                                value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Truck Count</label>
                            <input type="number" min="1" className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-200 focus:border-primary-500 outline-none" 
                                value={formData.truckCount} onChange={e => setFormData({...formData, truckCount: parseInt(e.target.value)})} />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded text-gray-400 hover:bg-gray-800">Cancel</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary-600 rounded text-white font-medium hover:bg-primary-500 disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Add Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- IMPORT MODAL ---
interface ImportModalProps {
    onClose: () => void;
    onImport: (data: any[]) => Promise<void>;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
            parseFile(e.target.files[0]);
        }
    };

    const parseFile = async (f: File) => {
        try {
            const data = await f.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: ['companyName', 'mcNumber', 'phoneNumber', 'email', 'state', 'truckCount'],
                range: 1 // Skip header row
            });
            setPreview(jsonData.slice(0, 5)); // Show first 5
        } catch (err) {
            setError('Failed to parse file. Ensure it is a valid Excel or CSV.');
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setIsProcessing(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            // We assume column order: Company, MC, Phone, Email, State, Trucks
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: ['companyName', 'mcNumber', 'phoneNumber', 'email', 'state', 'truckCount'],
                range: 1
            });
            await onImport(jsonData);
            onClose();
        } catch (err) {
            setError('Import failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
             <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-lg p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Upload className="w-5 h-5 text-primary-500" /> Import Leads
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center bg-gray-950/50 hover:bg-gray-950 hover:border-primary-500/50 transition-colors relative">
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <FileSpreadsheet className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Drag & drop or click to select CSV/Excel</p>
                        <p className="text-xs text-gray-600 mt-1">Columns: Company, MC#, Phone, Email, State, Trucks</p>
                    </div>

                    {file && (
                        <div className="text-sm text-green-400 flex items-center gap-2">
                            <Check className="w-4 h-4" /> Selected: {file.name}
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    {preview.length > 0 && (
                        <div className="bg-gray-950 p-2 rounded border border-gray-800">
                            <div className="text-xs text-gray-500 mb-2 uppercase font-semibold">Preview (First 5)</div>
                            <div className="space-y-1">
                                {preview.map((row: any, i) => (
                                    <div key={i} className="text-xs text-gray-300 grid grid-cols-3 gap-2">
                                        <span className="truncate">{String(row.companyName || '-')}</span>
                                        <span className="truncate font-mono text-gray-500">{String(row.mcNumber || '-')}</span>
                                        <span className="truncate">{String(row.phoneNumber || '-')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={onClose} className="px-4 py-2 rounded text-gray-400 hover:bg-gray-800">Cancel</button>
                        <button 
                            onClick={handleImport} 
                            disabled={!file || isProcessing} 
                            className="px-4 py-2 bg-primary-600 rounded text-white font-medium hover:bg-primary-500 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isProcessing ? 'Importing...' : 'Import Leads'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}