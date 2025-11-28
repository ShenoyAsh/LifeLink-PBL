import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Droplet, Search, Filter, X } from 'lucide-react';
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Button } from '../common';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show'
};

const donationTypeLabels = {
  WHOLE_BLOOD: 'Whole Blood',
  PLATELETS: 'Platelets',
  PLASMA: 'Plasma',
  DOUBLE_RED_CELLS: 'Double Red Cells'
};

const AppointmentList = ({ isAdminView = false }) => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/appointments/my-appointments');
        setAppointments(response.data.data || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Filter appointments based on search and filters
  const filteredAppointments = appointments.filter(appointment => {
    // Search term filter
    const matchesSearch = 
      !searchTerm ||
      appointment.bloodBank?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.donor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.donationType.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = !filters.status || appointment.status === filters.status;
    
    // Date range filter
    let matchesDate = true;
    const appointmentDate = new Date(appointment.date);
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && appointmentDate >= fromDate;
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && appointmentDate <= toDate;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleStatusChange = async (appointmentId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this appointment as ${statusLabels[newStatus]}?`)) {
      return;
    }

    try {
      await api.patch(`/api/appointments/${appointmentId}/status`, { status: newStatus });
      
      // Update local state
      setAppointments(appointments.map(apt => 
        apt._id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
      
      toast.success(`Appointment marked as ${statusLabels[newStatus]}`);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    }
  };

  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const getDayName = (dateString) => {
    return format(parseISO(dateString), 'EEEE');
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/appointments/new')}
          >
            New Appointment
          </Button>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                id="dateFrom"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                id="dateTo"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                min={filters.dateFrom}
              />
            </div>
            
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={clearFilters}
                className="w-full flex items-center justify-center"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No appointments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || Object.values(filters).some(Boolean)
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by scheduling a new appointment'}
          </p>
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={() => navigate('/appointments/new')}
            >
              Schedule Appointment
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => {
              const appointmentDate = parseISO(appointment.date);
              const isPastAppointment = isPast(appointmentDate);
              const isEditable = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';
              
              return (
                <li key={appointment._id} className="hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                          {statusLabels[appointment.status]}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {getDayName(appointment.date)}
                        </span>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        {isEditable && (
                          <button
                            onClick={() => navigate(`/appointments/${appointment._id}/edit`)}
                            className="mr-3 text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/appointments/${appointment._id}`)}
                          className="text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <p>
                            {formatDate(appointment.date)}
                            <span className="ml-2">
                              {appointment.startTime} - {appointment.endTime}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <Droplet className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        <p>{donationTypeLabels[appointment.donationType] || appointment.donationType}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        <p className="truncate">
                          {appointment.bloodBank?.name}
                          {appointment.bloodBank?.address && (
                            <span className="text-gray-400"> • {appointment.bloodBank.address}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {isEditable && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {appointment.status === 'PENDING' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusChange(appointment._id, 'CONFIRMED')}
                          >
                            Confirm
                          </Button>
                        )}
                        
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleStatusChange(appointment._id, 'CANCELLED')}
                        >
                          Cancel
                        </Button>
                        
                        {!isPastAppointment && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/appointments/${appointment._id}/reschedule`)}
                          >
                            Reschedule
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
