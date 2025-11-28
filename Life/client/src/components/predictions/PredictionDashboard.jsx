import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, PieChart, Pie, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Activity, AlertTriangle, Droplet, Bell, Calendar, 
  TrendingUp, Zap, BarChart2, PieChart as PieIcon, Info
} from 'lucide-react';
import api from '../../services/api';

const COLORS = {
  'A+': '#8884d8',
  'A-': '#83a6ed',
  'B+': '#8dd1e1',
  'B-': '#82ca9d',
  'AB+': '#a4de6c',
  'AB-': '#d0ed57',
  'O+': '#ffc658',
  'O-': '#ff8042',
};

const riskColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
  unknown: 'bg-gray-100 text-gray-800'
};

const PredictionDashboard = () => {
  const [predictions, setPredictions] = useState(null);
  const [inventoryStatus, setInventoryStatus] = useState([]);
  const [strategies, setStrategies] = useState({});
  const [loading, setLoading] = useState({
    predictions: true,
    inventory: true
  });
  const [error, setError] = useState(null);
  const [daysAhead, setDaysAhead] = useState(7);
  const [selectedBloodType, setSelectedBloodType] = useState(null);

  useEffect(() => {
    fetchPredictions();
    fetchInventoryStatus();
  }, [daysAhead]);

  const fetchPredictions = async () => {
    try {
      setLoading(prev => ({ ...prev, predictions: true }));
      const response = await api.get(`/api/v1/predictions/shortage?daysAhead=${daysAhead}`);
      setPredictions(response.data.data);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError('Failed to load predictions');
    } finally {
      setLoading(prev => ({ ...prev, predictions: false }));
    }
  };

  const fetchInventoryStatus = async () => {
    try {
      setLoading(prev => ({ ...prev, inventory: true }));
      const response = await api.get('/api/v1/predictions/inventory-status');
      setInventoryStatus(response.data.data);
    } catch (err) {
      console.error('Error fetching inventory status:', err);
      setError('Failed to load inventory status');
    } finally {
      setLoading(prev => ({ ...prev, inventory: false }));
    }
  };

  const fetchMitigationStrategies = async (bloodType, riskLevel) => {
    if (strategies[bloodType]) return;
    
    try {
      const response = await api.get(
        `/api/v1/predictions/strategies?bloodType=${bloodType}&riskLevel=${riskLevel}`
      );
      setStrategies(prev => ({
        ...prev,
        [bloodType]: response.data.data
      }));
    } catch (err) {
      console.error('Error fetching strategies:', err);
    }
  };

  const handleBloodTypeClick = (bloodType, riskLevel) => {
    setSelectedBloodType(bloodType);
    fetchMitigationStrategies(bloodType, riskLevel);
  };

  const renderRiskBadge = (riskLevel) => {
    const riskText = riskLevel?.toLowerCase() || 'unknown';
    return (
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          riskColors[riskText] || riskColors.unknown
        }`}
      >
        {riskText.charAt(0).toUpperCase() + riskText.slice(1)} Risk
      </span>
    );
  };

  const renderPredictionCards = () => {
    if (!predictions?.predictions?.length) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No prediction data available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {predictions.predictions.map((prediction) => (
          <div 
            key={prediction.bloodType}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedBloodType === prediction.bloodType ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleBloodTypeClick(prediction.bloodType, prediction.riskLevel)}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{prediction.bloodType}</h3>
              {renderRiskBadge(prediction.riskLevel)}
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Expected Shortage: {prediction.expectedShortage || 'N/A'} units
              </p>
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">
                  Confidence: {prediction.confidence ? `${(prediction.confidence * 100).toFixed(1)}%` : 'N/A'}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(prediction.confidence || 0) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderInventoryChart = () => {
    if (!inventoryStatus.length) return null;

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Inventory Levels</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bloodType" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Units Available" fill="#8884d8">
                {inventoryStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.bloodType]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderRiskRadar = () => {
    if (!predictions?.predictions?.length) return null;

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={predictions.predictions}>
              <PolarGrid />
              <PolarAngleAxis dataKey="bloodType" />
              <PolarRadiusAxis angle={30} domain={[0, 1]} />
              <Radar
                name="Risk Level"
                dataKey={entry => {
                  const riskMap = { high: 1, medium: 0.5, low: 0.2 };
                  return riskMap[entry.riskLevel?.toLowerCase()] || 0;
                }}
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderMitigationStrategies = () => {
    if (!selectedBloodType) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Click on a blood type card to view mitigation strategies
              </p>
            </div>
          </div>
        </div>
      );
    }

    const currentPrediction = predictions?.predictions?.find(
      p => p.bloodType === selectedBloodType
    );

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">
            Mitigation Strategies for {selectedBloodType}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Recommended actions to prevent potential shortage
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {currentPrediction && (
            <div className="mb-4">
              <div className="flex items-center">
                <h4 className="text-md font-medium text-gray-900">Current Risk:</h4>
                <div className="ml-2">
                  {renderRiskBadge(currentPrediction.riskLevel)}
                </div>
              </div>
              {currentPrediction.expectedShortage && (
                <p className="mt-1 text-sm text-gray-600">
                  Expected shortage: {currentPrediction.expectedShortage} units in next {daysAhead} days
                </p>
              )}
            </div>
          )}
          
          <h4 className="text-md font-medium text-gray-900 mb-3">Recommended Actions:</h4>
          {strategies[selectedBloodType] ? (
            <ul className="space-y-3">
              {strategies[selectedBloodType].map((strategy, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5">
                    <Zap className="h-5 w-5" />
                  </div>
                  <p className="ml-3 text-sm text-gray-700">{strategy}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          )}
          
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Bell className="-ml-1 mr-2 h-5 w-5" />
              Schedule Donation Drive
            </button>
            <button
              type="button"
              className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <TrendingUp className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              View Donor Analytics
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900">Blood Shortage Prediction</h2>
          <p className="mt-1 text-sm text-gray-500">
            AI-powered predictions of potential blood shortages based on historical data and current inventory
          </p>
          
          <div className="mt-4 flex items-center">
            <label htmlFor="daysAhead" className="mr-3 text-sm font-medium text-gray-700">
              Prediction Window:
            </label>
            <select
              id="daysAhead"
              className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={daysAhead}
              onChange={(e) => setDaysAhead(Number(e.target.value))}
            >
              <option value={3}>3 days</option>
              <option value={7}>1 week</option>
              <option value={14}>2 weeks</option>
              <option value={30}>1 month</option>
            </select>
            
            <div className="ml-4 flex items-center text-sm text-gray-500">
              <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              Last updated: {new Date().toLocaleString()}
            </div>
            
            <button
              onClick={fetchPredictions}
              disabled={loading.predictions}
              className="ml-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.predictions ? 'Refreshing...' : 'Refresh Predictions'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading.predictions ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {renderPredictionCards()}
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {renderInventoryChart()}
            {renderRiskRadar()}
          </div>
          
          <div className="mt-6">
            {renderMitigationStrategies()}
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Prediction Insights</h3>
              <p className="mt-1 text-sm text-gray-500">
                Analysis of current trends and recommendations
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Overall Risk Level</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {predictions?.overallRisk ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        riskColors[predictions.overallRisk.toLowerCase()] || riskColors.unknown
                      }`}>
                        {predictions.overallRisk}
                      </span>
                    ) : 'N/A'}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Priority Blood Types</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {predictions?.priorityBloodTypes?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {predictions.priorityBloodTypes.map(type => (
                          <span 
                            key={type} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    ) : 'N/A'}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Next Donation Drive</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {predictions?.nextDonationDriveRecommended ? (
                      <span className="text-red-600 font-medium">Recommended within the next 7 days</span>
                    ) : (
                      <span className="text-green-600">Not immediately required</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PredictionDashboard;
