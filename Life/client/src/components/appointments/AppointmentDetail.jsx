import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Droplet, 
  User, 
  Phone, 
  Mail, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  AlertCircle,
  Edit,
  Trash2,
  Printer,
  Share2,
  CalendarPlus,
  ChevronRight
} from 'lucide-react';
import { format, parseISO, isPast, isToday, isAfter } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Button } from '../common';

const statusIcons = {
  PENDING: <ClockIcon className="h-5 w-5 text-yellow-500" />,
  CONFIRMED: <CheckCircle className="h-5 w-5 text-blue-500" />,
  COMPLETED: <CheckCircle className="h-5 w-5 text-green-500" />,
  CANCELLED: <XCircle className="h-5 w-5 text-red-500" />,
  NO_SHOW: <AlertCircle className="h-5 w-5 text-red-500" />,
};

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
};

const statusLabels = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

const donationTypeLabels = {
  WHOLE_BLOOD: 'Whole Blood Donation',
  PLATELETS: 'Platelet Donation',
  PLASMA: 'Plasma Donation',
  DOUBLE_RED_CELLS: 'Double Red Cell Donation',
};

const AppointmentDetail = ({ isAdminView = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch appointment details
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/appointments/${id}`);
        setAppointment(response.data.data);
      } catch (error) {
        console.error('Error fetching appointment:', error);
        toast.error('Failed to load appointment details');
        navigate('/appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id, navigate]);

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this appointment as ${statusLabels[newStatus]}?`)) {
      return;
    }

    try {
      setUpdatingStatus(true);
      await api.patch(`/api/appointments/${id}/status`, { status: newStatus });
      
      // Update local state
      setAppointment({
        ...appointment,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      toast.success(`Appointment marked as ${statusLabels[newStatus]}`);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/api/appointments/${id}`);
      toast.success('Appointment deleted successfully');
      navigate('/appointments');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
  };

  const getTimeUntilAppointment = (dateString, timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const appointmentDateTime = new Date(dateString);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const diffInMs = appointmentDateTime - now;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays > 0) {
      return `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
    } else if (diffInDays === 0) {
      return 'Today';
    } else {
      return 'Past appointment';
    }
  };

  const isEditable = appointment && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED');

  if (loading || !appointment) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between md:space-x-5 mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(-1)}
              className="inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
          </div>
          
          <div className="mt-4 flex flex-col-reverse space-y-4 space-y-reverse sm:flex-row sm:space-y-0 sm:space-x-4 md:mt-0">
            {isEditable && (
              <>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleting || updatingStatus}
                  className="inline-flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/appointments/${id}/edit`)}
                  disabled={updatingStatus || deleting}
                  className="inline-flex items-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </>
            )}
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="inline-flex items-center"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button
                variant="primary"
                className="inline-flex items-center"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied to clipboard');
                }}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>
        
        {/* Status Banner */}
        <div className={`mb-8 p-4 rounded-lg ${statusColors[appointment.status]} flex items-center`}>
          <div className="flex-shrink-0 mr-3">
            {statusIcons[appointment.status]}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              Status: <span className="font-bold">{statusLabels[appointment.status]}</span>
            </p>
            {appointment.status === 'PENDING' && (
              <p className="mt-1 text-sm opacity-90">
                This appointment is awaiting confirmation from the blood bank.
              </p>
            )}
            {appointment.status === 'CONFIRMED' && (
               <p className="mt-1 text-sm opacity-90">
                 Your appointment is confirmed. Please arrive on time.
               </p>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Time and Date */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-blue-500 mr-2" />
              Date & Time
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="text-base font-medium text-gray-900">{formatDate(appointment.date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="text-base font-medium text-gray-900">
                  {appointment.startTime} - {appointment.endTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Happening</p>
                <p className="text-base font-medium text-blue-600">
                  {getTimeUntilAppointment(appointment.date, appointment.startTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 text-red-500 mr-2" />
              Location
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Blood Bank</p>
                <p className="text-base font-medium text-gray-900">
                  {appointment.bloodBank?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-base font-medium text-gray-900">
                  {appointment.bloodBank?.address || 'Address not available'}
                </p>
              </div>
              {appointment.bloodBank?.phone && (
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="text-base font-medium text-gray-900 flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {appointment.bloodBank.phone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Donation Information */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 md:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Droplet className="h-5 w-5 text-red-600 mr-2" />
              Donation Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Donation Type</p>
                <p className="text-base font-medium text-gray-900">
                  {donationTypeLabels[appointment.donationType] || appointment.donationType}
                </p>
              </div>
              {appointment.notes && (
                <div className="sm:col-span-2">
                   <p className="text-sm text-gray-500">Notes</p>
                   <p className="text-base text-gray-700 mt-1">{appointment.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;