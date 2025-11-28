import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import { Loader } from '../common';
import socketService from '../../services/socketService';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const defaultCenter = {
  lat: 20.5937, // Default to center of India
  lng: 78.9629
};

const DonorTrackingMap = ({ donorId, requestId, isDonor = false }) => {
  const mapRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [donorLocation, setDonorLocation] = useState(null);
  const [path, setPath] = useState([]);
  const [map, setMap] = useState(null);
  const [error, setError] = useState(null);

  // Get current location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(pos);
          
          // If this is the donor's device, start tracking
          if (isDonor && socketService.socket?.connected) {
            socketService.startLocationTracking(donorId, requestId);
          }
        },
        (err) => {
          console.error('Error getting location:', err);
          setError('Unable to retrieve your location. Please enable location services.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }

    // Cleanup function
    return () => {
      if (isDonor) {
        socketService.stopLocationTracking();
      }
    };
  }, [donorId, requestId, isDonor]);

  // Subscribe to donor location updates
  useEffect(() => {
    if (!isDonor && donorId) {
      const handleLocationUpdate = (data) => {
        if (data.donorId === donorId) {
          const newLocation = {
            lat: data.location.latitude,
            lng: data.location.longitude
          };
          setDonorLocation(newLocation);
          
          // Update path with new location
          setPath(prevPath => [...prevPath, newLocation]);
          
          // Pan map to follow the donor
          if (map) {
            map.panTo(newLocation);
          }
        }
      };

      // Subscribe to location updates
      const unsubscribe = socketService.onDonorLocationUpdate(handleLocationUpdate);

      // Cleanup subscription on unmount
      return () => unsubscribe();
    }
  }, [donorId, isDonor, map]);

  const onLoad = (map) => {
    setMap(map);
    
    // If we have a current location, center the map on it
    if (currentLocation) {
      map.panTo(currentLocation);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700">
        <p>{error}</p>
      </div>
    );
  }

  if (!currentLocation && !donorLocation) {
    return <Loader message="Loading map..." />;
  }

  const center = currentLocation || donorLocation || defaultCenter;

  return (
    <div className="relative w-full h-full">
      <LoadScript
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        loadingElement={<Loader />}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          onLoad={onLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          }}
        >
          {/* Current user's location */}
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              title="Your Location"
            />
          )}

          {/* Donor's location */}
          {donorLocation && (
            <>
              <Marker
                position={donorLocation}
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
                title="Donor"
              />
              
              {/* Path taken by donor */}
              {path.length > 1 && (
                <Polyline
                  path={path}
                  options={{
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                    fillColor: '#FF0000',
                    fillOpacity: 0.35,
                    clickable: false,
                    draggable: false,
                    editable: false,
                    visible: true,
                    radius: 30000,
                    paths: path,
                    zIndex: 1
                  }}
                />
              )}
            </>
          )}
        </GoogleMap>
      </LoadScript>
      
      {isDonor && (
        <div className="mt-2 text-sm text-gray-600">
          Your location is being shared with the recipient in real-time.
        </div>
      )}
    </div>
  );
};

export default DonorTrackingMap;
