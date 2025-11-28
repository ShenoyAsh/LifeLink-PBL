import React, { useState, useEffect } from 'react';
import { 
  Activity, Heart, Droplet, Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Info, Plus, Thermometer, 
  Droplet as BloodDrop, Weight, Ruler, Calendar as CalendarIcon, Clock as ClockIcon, TrendingUp, FileText, Download
} from 'lucide-react';
import { Tab } from '@headlessui/react';
import api from '../../services/api';

const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

const HealthTracker = ({ userId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [healthData, setHealthData] = useState({
    vitals: [],
    eligibility: {},
    donationHistory: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate days until next donation
  const daysUntilNextDonation = healthData.eligibility?.nextDonationDate 
    ? Math.ceil((new Date(healthData.eligibility.nextDonationDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setLoading(true);
        // Replace with actual API calls
        const [vitalsRes, eligibilityRes, historyRes] = await Promise.all([
          api.get(`/health/vitals/${userId}`),
          api.get(`/health/eligibility/${userId}`),
          api.get(`/donations/history/${userId}`)
        ]);

        setHealthData({
          vitals: vitalsRes.data || [],
          eligibility: eligibilityRes.data || {},
          donationHistory: historyRes.data || []
        });
      } catch (err) {
        console.error('Error fetching health data:', err);
        setError('Failed to load health data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, [userId]);

  const getVitalIcon = (type) => {
    const icons = {
      'BLOOD_PRESSURE': <Activity className="h-5 w-5 text-red-500" />,
      'HEART_RATE': <Heart className="h-5 w-5 text-pink-500" />,
      'HEMOGLOBIN': <Droplet className="h-5 w-5 text-red-600" />,
      'WEIGHT': <Weight className="h-5 w-5 text-blue-500" />,
      'HEIGHT': <Ruler className="h-5 w-5 text-green-500" />,
      'TEMPERATURE': <Thermometer className="h-5 w-5 text-orange-500" />,
    };
    return icons[type] || <Activity className="h-5 w-5 text-gray-500" />;
  };

  const getVitalLabel = (type) => {
    const labels = {
      'BLOOD_PRESSURE': 'Blood Pressure',
      'HEART_RATE': 'Heart Rate',
      'HEMOGLOBIN': 'Hemoglobin',
      'WEIGHT': 'Weight',
      'HEIGHT': 'Height',
      'TEMPERATURE': 'Temperature',
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  const renderDonationHistory = () => {
    if (loading) return <div className="text-center py-4">Loading donation history...</div>;
    if (error) return <div className="text-red-500 text-center py-4">{error}</div>;
    
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Donation History</h3>
        {healthData.donationHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No donation history found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {healthData.donationHistory.map((donation) => (
                  <tr key={donation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(donation.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{donation.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${donation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                          donation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {donation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{donation.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderVitals = () => {
    if (loading) return <div className="text-center py-4">Loading health vitals...</div>;
    if (error) return <div className="text-red-500 text-center py-4">{error}</div>;
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Health Vitals</h3>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Vitals
          </button>
        </div>
        
        {healthData.vitals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No health vitals recorded yet</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Vital Signs</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Your recorded health metrics</p>
            </div>
            <div className="border-t border-gray-200">
              <dl className="sm:divide-y sm:divide-gray-200">
                {healthData.vitals.map((vital) => (
                  <div key={vital.id} className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      {getVitalIcon(vital.type)}
                      <span className="ml-2">{getVitalLabel(vital.type)}</span>
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{vital.value}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(vital.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {vital.notes && (
                        <p className="mt-1 text-xs text-gray-500">{vital.notes}</p>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEligibility = () => {
    if (loading) return <div className="text-center py-4">Loading eligibility information...</div>;
    if (error) return <div className="text-red-500 text-center py-4">{error}</div>;
    
    const eligibility = healthData.eligibility || {};
    const requirements = [
      {
        id: 'age',
        label: 'Age Requirement',
        description: 'Must be between 18 and 65 years old',
        status: eligibility.ageEligible ? 'met' : 'not-met',
        value: eligibility.age ? `${eligibility.age} years` : 'Not specified'
      },
      {
        id: 'weight',
        label: 'Weight Requirement',
        description: 'Must be at least 50 kg (110 lbs)',
        status: eligibility.weightEligible ? 'met' : 'not-met',
        value: eligibility.weight ? `${eligibility.weight} kg` : 'Not specified'
      },
      {
        id: 'hemoglobin',
        label: 'Hemoglobin Level',
        description: 'Must be at least 12.5 g/dL for women, 13.5 g/dL for men',
        status: eligibility.hemoglobinEligible ? 'met' : 'not-met',
        value: eligibility.hemoglobin ? `${eligibility.hemoglobin} g/dL` : 'Not tested'
      },
      {
        id: 'lastDonation',
        label: 'Last Donation',
        description: 'Must be at least 56 days since last donation',
        status: eligibility.lastDonationEligible ? 'met' : 'not-met',
        value: eligibility.lastDonationDate 
          ? new Date(eligibility.lastDonationDate).toLocaleDateString() 
          : 'No previous donations'
      }
    ];

    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Eligibility Status</h3>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Donation Eligibility
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {eligibility.isEligible 
                ? 'You are eligible to donate blood.' 
                : 'You are not currently eligible to donate blood.'}
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              {requirements.map((req) => (
                <div key={req.id} className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    <div className="flex items-center">
                      {req.status === 'met' ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      {req.label}
                    </div>
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{req.value}</span>
                      <span className={`text-sm ${req.status === 'met' ? 'text-green-600' : 'text-red-600'}`}>
                        {req.status === 'met' ? 'Met' : 'Not Met'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{req.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        
        {!eligibility.isEligible && eligibility.nextEligibleDate && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You will be eligible to donate on{' '}
                  <span className="font-medium">
                    {new Date(eligibility.nextEligibleDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Health Tips
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              How to prepare for your next donation
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Before Donation</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Get a good night's sleep</li>
                    <li>Eat a healthy meal before donating</li>
                    <li>Drink plenty of water</li>
                    <li>Avoid fatty foods before donation</li>
                  </ul>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">After Donation</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Drink extra fluids for 1-2 days</li>
                    <li>Avoid strenuous exercise for 24 hours</li>
                    <li>Keep the bandage on for several hours</li>
                    <li>Eat iron-rich foods to replenish iron stores</li>
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Health & Donation Tracker</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-lg bg-blue-900/20 p-1">
              {['Overview', 'Donation History', 'Health Vitals', 'Eligibility'].map((tab) => (
                <Tab
                  key={tab}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-md py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white shadow text-blue-700'
                        : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                    )
                  }
                >
                  {tab}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="mt-2">
              <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                          <Heart className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Next Donation
                            </dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-gray-900">
                                {healthData.eligibility?.nextDonationDate 
                                  ? new Date(healthData.eligibility.nextDonationDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })
                                  : 'N/A'}
                              </div>
                              {healthData.eligibility?.nextDonationDate && (
                                <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                                  {daysUntilNextDonation > 0 
                                    ? `in ${daysUntilNextDonation} days`
                                    : 'Eligible now'}
                                </div>
                              )}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:px-6">
                      <div className="text-sm">
                        <a
                          href="#"
                          className="font-medium text-blue-600 hover:text-blue-500"
                        >
                          Schedule Donation<span className="sr-only"> Schedule Donation</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                          <Droplet className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total Donations
                            </dt>
                            <dd>
                              <div className="text-2xl font-semibold text-gray-900">
                                {healthData.eligibility?.totalDonations || 0}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:px-6">
                      <div className="text-sm">
                        <a
                          href="#donation-history"
                          className="font-medium text-blue-600 hover:text-blue-500"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveTab(1); // Switch to Donation History tab
                          }}
                        >
                          View history<span className="sr-only"> View donation history</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Health Summary</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Your recent health metrics and vitals
                    </p>
                  </div>
                  <div className="border-t border-gray-200">
                    <dl className="sm:divide-y sm:divide-gray-200">
                      {healthData.vitals.slice(0, 4).map((vital) => (
                        <div key={vital.id} className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500 flex items-center">
                            {getVitalIcon(vital.type)}
                            <span className="ml-2">{getVitalLabel(vital.type)}</span>
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{vital.value}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(vital.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            {vital.notes && (
                              <p className="mt-1 text-xs text-gray-500">{vital.notes}</p>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6 text-right text-sm">
                    <a
                      href="#health-vitals"
                      className="font-medium text-blue-600 hover:text-blue-500"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(2); // Switch to Health Vitals tab
                      }}
                    >
                      View all vitals<span className="sr-only"> View all health vitals</span>
                    </a>
                  </div>
                </div>
              </Tab.Panel>
              
              <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                {renderDonationHistory()}
              </Tab.Panel>
              
              <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                {renderVitals()}
              </Tab.Panel>
              
              <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                {renderEligibility()}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
};

export default HealthTracker;
