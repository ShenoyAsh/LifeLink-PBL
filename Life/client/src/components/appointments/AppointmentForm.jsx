import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, Droplet, AlertCircle, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Button, Select, TextArea } from '../common';
import AppointmentCalendar from './AppointmentCalendar';

const donationTypes = [
  { value: 'WHOLE_BLOOD', label: 'Whole Blood Donation' },
  { value: 'PLATELETS', label: 'Platelet Donation' },
  { value: 'PLASMA', label: 'Plasma Donation' },
  { value: 'DOUBLE_RED_CELLS', label: 'Double Red Cell Donation' }
];

const schema = yup.object().shape({
  bloodBank: yup.string().required('Blood bank is required'),
  donationType: yup.string().required('Donation type is required'),
  date: yup.date().required('Date is required'),
  startTime: yup.string().required('Start time is required'),
  endTime: yup.string().required('End time is required'),
  notes: yup.string().max(500, 'Notes cannot exceed 500 characters')
});

const AppointmentForm = ({ bloodBanks, appointment = null }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedBloodBank, setSelectedBloodBank] = useState(
    bloodBanks.length === 1 ? bloodBanks[0]._id : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      bloodBank: appointment?.bloodBank?._id || (bloodBanks.length === 1 ? bloodBanks[0]._id : ''),
      donationType: appointment?.donationType || 'WHOLE_BLOOD',
      date: appointment?.date ? new Date(appointment.date) : null,
      startTime: appointment?.startTime || '',
      endTime: appointment?.endTime || '',
      notes: appointment?.notes || ''
    }
  });

  // Set initial values when editing
  useEffect(() => {
    if (appointment) {
      setValue('bloodBank', appointment.bloodBank?._id);
      setValue('donationType', appointment.donationType);
      setValue('date', new Date(appointment.date));
      setValue('startTime', appointment.startTime);
      setValue('endTime', appointment.endTime);
      setValue('notes', appointment.notes);
      
      if (appointment.date && appointment.startTime && appointment.endTime) {
        setSelectedSlot({
          date: new Date(appointment.date),
          startTime: appointment.startTime,
          endTime: appointment.endTime
        });
      }
    }
  }, [appointment, setValue]);

  const handleBloodBankChange = (e) => {
    const bankId = e.target.value;
    setSelectedBloodBank(bankId);
    setValue('bloodBank', bankId);
    // Reset time slot when blood bank changes
    setSelectedSlot(null);
    setValue('date', null);
    setValue('startTime', '');
    setValue('endTime', '');
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setValue('date', slot.date);
    setValue('startTime', slot.startTime);
    setValue('endTime', slot.endTime);
  };

  const onSubmit = async (data) => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const appointmentData = {
        bloodBank: data.bloodBank,
        donationType: data.donationType,
        date: format(data.date, 'yyyy-MM-dd'),
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes
      };

      let response;
      if (id) {
        // Update existing appointment
        response = await api.put(`/api/appointments/${id}`, appointmentData);
        toast.success('Appointment updated successfully');
      } else {
        // Create new appointment
        response = await api.post('/api/appointments', appointmentData);
        toast.success('Appointment scheduled successfully');
      }

      // Redirect to appointments list
      navigate('/appointments');
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error(
        error.response?.data?.message || 
        `Failed to ${id ? 'update' : 'schedule'} appointment`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const format = (date, formatStr) => {
    if (!date) return '';
    const d = new Date(date);
    
    // Simple formatter for our needs
    const pad = (num) => (num < 10 ? `0${num}` : num);
    
    return formatStr
      .replace('yyyy', d.getFullYear())
      .replace('MM', pad(d.getMonth() + 1))
      .replace('dd', pad(d.getDate()));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {id ? 'Update Appointment' : 'Schedule New Appointment'}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Select a blood bank and available time slot for your donation
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="divide-y divide-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Blood Bank Selection */}
              <div className="sm:col-span-6">
                <label htmlFor="bloodBank" className="block text-sm font-medium text-gray-700">
                  Blood Bank
                </label>
                <div className="mt-1">
                  <select
                    id="bloodBank"
                    {...register('bloodBank')}
                    onChange={handleBloodBankChange}
                    value={selectedBloodBank}
                    disabled={isSubmitting || (appointment && appointment.status !== 'PENDING')}
                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
                      errors.bloodBank ? 'border-red-300' : 'border'
                    }`}
                  >
                    <option value="">Select a blood bank</option>
                    {bloodBanks.map((bank) => (
                      <option key={bank._id} value={bank._id}>
                        {bank.name} - {bank.address?.city}
                      </option>
                    ))}
                  </select>
                  {errors.bloodBank && (
                    <p className="mt-1 text-sm text-red-600">{errors.bloodBank.message}</p>
                  )}
                </div>
              </div>

              {/* Donation Type */}
              <div className="sm:col-span-6">
                <label htmlFor="donationType" className="block text-sm font-medium text-gray-700">
                  Donation Type
                </label>
                <div className="mt-1">
                  <select
                    id="donationType"
                    {...register('donationType')}
                    disabled={isSubmitting || (appointment && appointment.status !== 'PENDING')}
                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
                      errors.donationType ? 'border-red-300' : 'border'
                    }`}
                  >
                    {donationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.donationType && (
                    <p className="mt-1 text-sm text-red-600">{errors.donationType.message}</p>
                  )}
                </div>
              </div>

              {/* Calendar and Time Slot Selection */}
              {selectedBloodBank && (
                <div className="sm:col-span-6">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Select Date & Time
                    </h4>
                    <p className="text-sm text-gray-500">
                      Choose an available time slot for your donation
                    </p>
                  </div>
                  
                  <AppointmentCalendar
                    bloodBankId={selectedBloodBank}
                    onSelectSlot={handleSlotSelect}
                    selectedDate={watch('date')}
                    onDateChange={(date) => {
                      setValue('date', date);
                      // Reset times when date changes
                      setValue('startTime', '');
                      setValue('endTime', '');
                      setSelectedSlot(null);
                    }}
                  />
                  
                  {(errors.date || errors.startTime || errors.endTime) && (
                    <div className="mt-2 flex items-center text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>Please select a date and time slot</span>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Time Slot Summary */}
              {selectedSlot && (
                <div className="sm:col-span-6 p-4 bg-blue-50 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">
                        Selected Time Slot
                      </h4>
                      <div className="mt-1 text-sm text-gray-600">
                        <p className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {format(selectedSlot.date, 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="flex items-center mt-1">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          {selectedSlot.startTime} - {selectedSlot.endTime}
                        </p>
                        <p className="flex items-center mt-1">
                          <Droplet className="h-4 w-4 mr-2 text-gray-500" />
                          {donationTypes.find(t => t.value === watch('donationType'))?.label}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              <div className="sm:col-span-6">
                <TextArea
                  id="notes"
                  label="Additional Notes (Optional)"
                  placeholder="Any special requirements or notes for the blood bank..."
                  {...register('notes')}
                  error={errors.notes?.message}
                  disabled={isSubmitting || (appointment && appointment.status !== 'PENDING')}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={
                  isSubmitting || 
                  (appointment && appointment.status !== 'PENDING')
                }
                loading={isSubmitting}
              >
                {id ? 'Update Appointment' : 'Schedule Appointment'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
