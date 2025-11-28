import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '../common';
import DonorTrackingMap from '../maps/DonorTrackingMap';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socketService';
import api from '../../services/api';

const DonorTracking = () => {
  const { requestId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch request details
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await api.get(`/api/donation-requests/${requestId}`);
        setRequest(response.data);
        
        // If the donor is already assigned to this request, start tracking
        if (response.data.status === 'ACCEPTED' && 
            response.data.donor?._id === user._id) {
          setIsTracking(true);
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
    const handleRequestUpdate = (data) => {
      if (data.requestId === requestId) {
        setRequest(prev => ({
          ...prev,
          ...data.updates
        }));
        
        if (data.updates.status === 'COMPLETED' || data.updates.status === 'CANCELLED') {
          // Stop tracking if the request is completed or cancelled
          socketService.stopLocationTracking();
          setIsTracking(false);
        }
      }
    };

    // Subscribe to request updates
    socketService.on('donationUpdate', handleRequestUpdate);

    // Cleanup
    return () => {
      socketService.off('donationUpdate', handleRequestUpdate);
      socketService.stopLocationTracking();
    };
  }, [requestId, user._id]);

  const handleStartTracking = () => {
    if (!request) return;
    
    // Start sharing location
    socketService.startLocationTracking(user._id, requestId);
    setIsTracking(true);
    
    // Update request status to IN_PROGRESS
    api.patch(`/api/donation-requests/${requestId}/status`, {
      status: 'IN_PROGRESS'
    }).catch(console.error);
    
    toast.info('Location sharing started. The recipient can now see your location.');
  };

  const handleCompleteDonation = async () => {
    try {
      await api.patch(`/api/donation-requests/${requestId}/status`, {
        status: 'COMPLETED'
      });
      
      // Stop sharing location
      socketService.stopLocationTracking();
      setIsTracking(false);
      
      toast.success('Donation marked as completed!');
      navigate('/donor/dashboard');
    } catch (err) {
      console.error('Error completing donation:', err);
      toast.error('Failed to update donation status');
    }
  };

  const handleCancelDonation = async () => {
    if (window.confirm('Are you sure you want to cancel this donation?')) {
      try {
        await api.patch(`/api/donation-requests/${requestId}/status`, {
          status: 'CANCELLED'
        });
        
        // Stop sharing location
        socketService.stopLocationTracking();
        setIsTracking(false);
        
        toast.info('Donation cancelled');
        navigate('/donor/dashboard');
      } catch (err) {
        console.error('Error cancelling donation:', err);
        toast.error('Failed to cancel donation');
      }
    }
  };

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
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Donation Request: {request.patientName || 'Emergency Request'}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {request.bloodGroup} • {request.unitsNeeded} units needed • {request.hospital?.name || request.location}
          </p>
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${request.status === 'ACCEPTED' || request.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : ''}
                  ${request.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                  ${request.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}`}>
                  {request.status.replace('_', ' ')}
                </span>
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Patient Details</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {request.patientName} • {request.patientAge} years • {request.gender}
              </dd>
            </div>
            
            {request.notes && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {request.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-md font-medium mb-4">Live Location Tracking</h4>
          
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <DonorTrackingMap 
              donorId={request.donor?._id} 
              requestId={requestId} 
              isDonor={request.donor?._id === user._id}
            />
          </div>
          
          <div className="mt-4 flex justify-end space-x-3">
            {request.status === 'ACCEPTED' && request.donor?._id === user._id && !isTracking && (
              <Button 
                variant="primary" 
                onClick={handleStartTracking}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Sharing My Location
              </Button>
            )}
            
            {isTracking && (
              <>
                <Button 
                  variant="danger" 
                  onClick={handleCancelDonation}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Cancel Donation
                </Button>
                <Button 
                  variant="success" 
                  onClick={handleCompleteDonation}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark as Completed
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorTracking;
