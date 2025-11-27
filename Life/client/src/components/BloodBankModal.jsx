import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Loader2, Search, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';

export default function BloodBankModal({ isOpen, onClose }) {
  const [banks, setBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const csvUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5001') + '/static/blood_banks.csv';

  useEffect(() => {
    if (isOpen) {
      const fetchBanks = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(csvUrl);
          if (!res.ok) throw new Error('Network response was not ok');
          
          const text = await res.text();
          const rows = text.split('\n').filter(Boolean);
          const headers = rows[0].split(',');
          const data = rows.slice(1).map(row => {
            const values = row.split(',');
            return headers.reduce((obj, header, i) => {
              obj[header.trim()] = values[i] ? values[i].trim() : '';
              return obj;
            }, {});
          });
          
          setBanks(data);
          setFilteredBanks(data);
          
        } catch (err) {
          toast.error('Failed to load blood bank directory.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchBanks();
    }
  }, [isOpen, csvUrl]);

  // --- Search Logic ---
  useEffect(() => {
    const results = banks.filter(bank => 
      (bank.Name && bank.Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bank.City && bank.City.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bank.Address && bank.Address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredBanks(results);
  }, [searchTerm, banks]);

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                <div className="flex justify-between items-center mb-4">
                    <DialogTitle as="h3" className="text-2xl font-bold leading-6 text-gray-900">
                    Blood Bank Directory
                    </DialogTitle>
                    <a 
                        href={csvUrl} 
                        download="blood_banks.csv"
                        className="rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-800 hover:bg-green-200"
                    >
                        Download CSV
                    </a>
                </div>

                {/* --- Search Bar --- */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="Search by Name, City, or Address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="mt-4 max-h-[60vh] overflow-auto border rounded-lg">
                  {isLoading ? (
                    <div className="flex justify-center items-center p-10">
                        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                  ) : filteredBanks.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBanks.map((bank, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{bank.Name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {bank.City}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bank.Phone}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={bank.Address}>
                                        <div className="flex items-center">
                                            <MapPin className="h-3 w-3 mr-1 text-gray-400"/>
                                            {bank.Address}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  ) : (
                    <div className="p-10 text-center text-gray-500">
                        No blood banks found matching your search.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}