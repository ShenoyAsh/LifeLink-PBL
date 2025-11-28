import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import DonorTrackingMap from '../maps/DonorTrackingMap';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

const DonorTrackingView = () => {
  const { requestId } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donorLocation, setDonorLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');

  // Fetch request details
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await api.get(`/api/donation-requests/${requestId}`);
        setRequest(response.data);
        
        // If donor is assigned, start tracking
        if (response.data.donor) {
          // Initial donor location if available
          if (response.data.donorLocation) {
            setDonorLocation({
              lat: response.data.donorLocation.coordinates[1],
              lng: response.data.donorLocation.coordinates[0]
            });
          }
        }
      } catch (err) {
        console.error('Error fetching request:', err);
        setError('Failed to load request details');
        toast.error('Could not load donation request');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();

    // Handle socket events
    const handleDonorLocationUpdate = (data) => {
      if (data.donorId === request?.donor?._id) {
        setDonorLocation({
          lat: data.location.latitude,
          lng: data.location.longitude
        });
        setLastUpdated(new Date());
      }
    };

    const handleRequestUpdate = (data) => {
      if (data.requestId === requestId) {
        setRequest(prev => ({
          ...prev,
          ...data.updates
        }));
      }
    };

    // Subscribe to location updates
    const unsubscribeLocation = socketService.onDonorLocationUpdate(handleDonorLocationUpdate);
    
    // Subscribe to request updates
    socketService.on('donationUpdate', handleRequestUpdate);

    // Cleanup
    return () => {
      unsubscribeLocation();
      socketService.off('donationUpdate', handleRequestUpdate);
    };
  }, [requestId, request?.donor?._id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Request not found</h3>
        <p className="mt-2 text-sm text-gray-500">The donation request you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Donation Request: {request.patientName || 'Emergency Request'}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {request.bloodGroup} • {request.unitsNeeded} units needed • {request.hospital?.name || request.location}
              </p>
            </div>
            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
              ${request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${request.status === 'ACCEPTED' || request.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : ''}
              ${request.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
              ${request.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}`}>
              {request.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Patient Details</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {request.patientName} • {request.patientAge} years • {request.gender}
              </dd>
            </div>
            
            {request.donor && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Donor Information</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <p className="font-medium">{request.donor.name}</p>
                  <p className="text-gray-600">{request.donor.phone}</p>
                  <p className="text-gray-600">Blood Group: {request.donor.bloodGroup}</p>
                  {donorLocation && lastUpdated && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
                    </p>
                  )}
                </dd>
              </div>
            )}
            
            {request.notes && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {request.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium">Donor's Live Location</h4>
            {donorLocation && lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
              </span>
            )}
          </div>
          
          <div className="rounded-lg overflow-hidden border border-gray-200">
            {donorLocation ? (
              <DonorTrackingMap 
                donorId={request.donor?._id} 
                requestId={requestId}
              />
            ) : (
              <div className="h-64 bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">
                  {request.status === 'ACCEPTED' || request.status === 'IN_PROGRESS'
                    ? 'Waiting for donor to start sharing location...'
                    : 'No donor assigned yet'}
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            {!donorLocation && request.donor && (
              <p className="flex items-center">
                <svg className="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Ask the donor to start sharing their location from their app.
              </p>
            )}
            {donorLocation && (
              <p className="text-green-600 flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                You're now tracking the donor's location in real-time.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorTrackingView;
