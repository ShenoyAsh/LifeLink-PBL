import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { Loader2, Send, MapPin, Phone, Mail, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FindMatch() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [radiusKm, setRadiusKm] = useState(20);
  
  // New Filter States
  const [filterName, setFilterName] = useState('');
  const [filterBloodType, setFilterBloodType] = useState('');
  
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAlertLoading, setIsAlertLoading] = useState(null);

  // Fetch patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patients');
        setPatients(res.data);
        if (res.data.length > 0) {
          setSelectedPatientId(res.data[0]._id);
        }
      } catch (err) {
        toast.error('Failed to fetch patients');
      }
    };
    fetchPatients();
  }, []);

  const handleFindMatch = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Please select a patient');
      return;
    }
    
    setIsLoading(true);
    setMatches([]);
    
    // Construct query params
    const params = new URLSearchParams({
        patientId: selectedPatientId,
        radiusKm: radiusKm,
    });
    
    if (filterName) params.append('name', filterName);
    if (filterBloodType) params.append('bloodType', filterBloodType);

    try {
      const res = await api.get(`/find-match?${params.toString()}`);
      setMatches(res.data);
      if (res.data.length === 0) {
        toast.info('No compatible donors found with current filters.');
      } else {
        toast.success(`Found ${res.data.length} matching donor(s)!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to find matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAlert = async (donorId) => {
    setIsAlertLoading(donorId);
    try {
        const res = await api.post('/send-alert', {
            donorId: donorId,
            patientId: selectedPatientId
        });
        toast.success(res.data.message);
    } catch (err) {
         toast.error(err.response?.data?.message || 'Failed to send alert');
    } finally {
        setIsAlertLoading(null);
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Find a Match</h1>
      
      {/* Search Form */}
      <form onSubmit={handleFindMatch} className="mt-8 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Patient Selection */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="patient" className="block text-sm font-medium text-gray-700">Select Patient</label>
            <select
              id="patient"
              name="patient"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-green focus:ring-primary-green p-2 border"
            >
              <option value="" disabled>-- Select a patient --</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.bloodType}) - {p.location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Radius Filter */}
          <div>
            <label htmlFor="radius" className="block text-sm font-medium text-gray-700">Search Radius (km)</label>
            <input
              type="number"
              id="radius"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-green focus:ring-primary-green p-2 border"
            />
          </div>

          {/* Name Filter */}
          <div>
            <label htmlFor="filterName" className="block text-sm font-medium text-gray-700">Filter by Name</label>
            <input
              type="text"
              id="filterName"
              placeholder="Optional"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-green focus:ring-primary-green p-2 border"
            />
          </div>

          {/* Blood Type Specific Filter */}
          <div>
            <label htmlFor="filterBlood" className="block text-sm font-medium text-gray-700">Specific Blood Type</label>
             <select
              id="filterBlood"
              value={filterBloodType}
              onChange={(e) => setFilterBloodType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-green focus:ring-primary-green p-2 border"
            >
              <option value="">Any Compatible</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                  <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* Search Button */}
          <div className="md:col-span-2 lg:col-span-1 flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center items-center gap-2 rounded-md border border-transparent bg-primary-green py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-dark-green focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Filter className="h-4 w-4"/> Apply Filters</>}
            </button>
          </div>
        </div>
      </form>

      {/* Results */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-900">Matching Donors</h2>
        {isLoading && <p className="mt-4 text-gray-500">Searching...</p>}
        
        {!isLoading && matches.length === 0 && (
            <p className="mt-4 text-gray-500">No matches found. Try adjusting the search radius or filters.</p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map(match => (
            <motion.div
              key={match._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-900/5 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">{match.name}</h3>
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  {match.bloodType}
                </span>
              </div>
              
              {/* Gamification Badges Display */}
               <div className="flex gap-1 mt-2">
                {match.badges && match.badges.slice(0, 3).map((badge, i) => (
                    <span key={i} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full" title={badge.description}>
                        {badge.name}
                    </span>
                ))}
              </div>

              <p className="mt-2 text-lg font-bold text-green-700">
                {match.distanceKm.toFixed(1)} km away
              </p>
              
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{match.location.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{match.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{match.email}</span>
                </div>
              </div>

              <button
                onClick={() => handleSendAlert(match._id)}
                disabled={isAlertLoading === match._id}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isAlertLoading === match._id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Alert
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}