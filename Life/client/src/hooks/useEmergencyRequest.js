import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

export const useEmergencyRequest = () => {
  const [formData, setFormData] = useState({
    patientName: '',
    bloodType: 'A+',
    unitsRequired: 1,
    urgency: 'Medium',
    location: {
      name: '',
      lat: null,
      lng: null,
    },
    hospital: {
      name: '',
      contact: '',
      address: ''
    },
    notes: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = [
    { value: 'Critical', label: 'Critical (Needed within 4 hours)' },
    { value: 'High', label: 'High (Needed within 12 hours)' },
    { value: 'Medium', label: 'Medium (Needed within 24 hours)' },
    { value: 'Low', label: 'Low (Can wait 24+ hours)' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields (location, hospital)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLocationSelect = (place) => {
    if (!place || !place.geometry) return;
    
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const name = place.formatted_address || place.name || 'Selected Location';
    
    setFormData(prev => ({
      ...prev,
      location: {
        name,
        lat,
        lng
      }
    }));
  };

  const validateStep = (step) => {
    // Basic validation for each step
    switch(step) {
      case 1:
        if (!formData.patientName.trim()) {
          toast.error('Please enter patient name');
          return false;
        }
        if (!formData.location.lat || !formData.location.lng) {
          toast.error('Please select a valid location');
          return false;
        }
        return true;
      case 2:
        if (!formData.hospital.name.trim()) {
          toast.error('Please enter hospital name');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    
    setIsLoading(true);
    try {
      const response = await api.post('/emergency-requests', {
        ...formData,
        requiredBloodType: formData.bloodType,
        location: {
          type: 'Point',
          coordinates: [formData.location.lng, formData.location.lat],
          name: formData.location.name
        }
      });
      
      toast.success('Emergency request submitted successfully!');
      navigate(`/request/${response.data.id}`);
    } catch (error) {
      console.error('Error submitting emergency request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleLocationSelect,
    handleSubmit,
    isLoading,
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    bloodTypes,
    urgencyLevels,
  };
};
