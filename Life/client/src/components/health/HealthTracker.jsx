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
  // ... (previous state and effect hooks remain the same)
  
  // Render methods and JSX remain the same until the end of the file
  
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
