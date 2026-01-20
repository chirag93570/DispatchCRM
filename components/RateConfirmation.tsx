import React, { useRef } from 'react';
import { FileText, Save, Printer } from 'lucide-react';

const RateConfirmation: React.FC = () => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="h-full p-6 overflow-y-auto max-w-5xl mx-auto">
            {/* Print Styles: Hides sidebar/buttons when printing */}
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-area, #printable-area * {
                        visibility: visible;
                    }
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    /* Hide scrollbars and backgrounds */
                    ::-webkit-scrollbar { display: none; }
                }
                `}
            </style>

            <div className="flex justify-between items-center mb-8 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                        <FileText className="text-primary-500" /> Carrier Rate Confirmation
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Generate and send onboarding documents</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handlePrint}
                        className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 flex items-center gap-2 text-sm"
                    >
                        <Printer size={16} /> Print / Save PDF
                    </button>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-500 flex items-center gap-2 text-sm font-medium">
                        <Save size={16} /> Save Data
                    </button>
                </div>
            </div>

            {/* The Document */}
            <div id="printable-area" ref={componentRef} className="bg-white text-black p-8 rounded-lg shadow-xl min-h-[800px]">
                {/* Header */}
                <div className="flex justify-between border-b-2 border-black pb-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-tight">RK Dispatch Solutions</h1>
                        <p className="text-sm mt-1">123 Logistics Way, Dallas, TX 75001</p>
                        <p className="text-sm">Phone: (555) 123-4567 | Email: dispatch@rkdispatch.com</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold">RATE CONFIRMATION</div>
                        <div className="text-sm mt-1">Order #: <span className="font-mono">RK-{new Date().getFullYear()}-{Math.floor(Math.random() * 10000)}</span></div>
                        <div className="text-sm">Date: {new Date().toLocaleDateString()}</div>
                    </div>
                </div>

                {/* Carrier Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="border border-gray-300 p-4">
                        <div className="text-xs font-bold uppercase text-gray-500 mb-2">Carrier Information</div>
                        <input type="text" placeholder="Carrier Name" className="w-full border-b border-gray-300 focus:outline-none mb-2 font-bold" />
                        <div className="flex gap-4">
                            <input type="text" placeholder="MC #" className="w-1/2 border-b border-gray-300 focus:outline-none text-sm" />
                            <input type="text" placeholder="DOT #" className="w-1/2 border-b border-gray-300 focus:outline-none text-sm" />
                        </div>
                        <input type="text" placeholder="Driver Name & Phone" className="w-full border-b border-gray-300 focus:outline-none mt-2 text-sm" />
                    </div>
                    <div className="border border-gray-300 p-4 bg-gray-50">
                        <div className="text-xs font-bold uppercase text-gray-500 mb-2">Rate Details</div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Flat Rate:</span>
                            <div className="flex items-center">
                                $ <input type="number" className="w-24 border-b border-gray-400 bg-transparent text-right font-bold" defaultValue={0} />
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-4">
                            * Rate includes all fuel surcharges.
                        </div>
                    </div>
                </div>

                {/* Load Details */}
                <div className="mb-8">
                    <h3 className="font-bold border-b border-black mb-4">LOAD DETAILS</h3>
                    
                    {/* Pickup */}
                    <div className="flex gap-4 mb-4">
                        <div className="w-16 font-bold bg-black text-white text-center py-1">PICK</div>
                        <div className="flex-1">
                            <input type="datetime-local" className="border border-gray-300 p-1 text-sm mb-1" />
                            <input type="text" placeholder="Shipper Name" className="w-full font-bold border-b border-gray-300 focus:outline-none" />
                            <input type="text" placeholder="Address, City, State, Zip" className="w-full border-b border-gray-300 focus:outline-none text-sm" />
                        </div>
                    </div>

                    {/* Drop */}
                    <div className="flex gap-4">
                        <div className="w-16 font-bold bg-black text-white text-center py-1">DROP</div>
                        <div className="flex-1">
                            <input type="datetime-local" className="border border-gray-300 p-1 text-sm mb-1" />
                            <input type="text" placeholder="Consignee Name" className="w-full font-bold border-b border-gray-300 focus:outline-none" />
                            <input type="text" placeholder="Address, City, State, Zip" className="w-full border-b border-gray-300 focus:outline-none text-sm" />
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="border border-gray-300 p-4 mb-8 min-h-[100px]">
                     <div className="text-xs font-bold uppercase text-gray-500 mb-2">Dispatch Notes / Commodities</div>
                     <textarea className="w-full h-full resize-none outline-none text-sm bg-transparent" placeholder="Enter commodity details, weight, special instructions..."></textarea>
                </div>

                {/* Footer Signatures */}
                <div className="mt-12 pt-8 border-t-2 border-black grid grid-cols-2 gap-12">
                     <div>
                         <div className="h-10 border-b border-black mb-2"></div>
                         <div className="text-xs font-bold uppercase">Dispatcher Signature</div>
                     </div>
                     <div>
                         <div className="h-10 border-b border-black mb-2"></div>
                         <div className="text-xs font-bold uppercase">Carrier Signature</div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default RateConfirmation;