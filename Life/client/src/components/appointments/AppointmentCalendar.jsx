import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Button } from '../common';
import api from '../../services/api';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AppointmentCalendar = ({ bloodBankId, onSelectSlot, selectedDate, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);

  // Generate days for the current month view
  const generateDays = () => {
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const days = [];
    let currentDate = startDate;
    
    // Add days from previous month to fill the first week
    const startDay = startDate.getDay();
    for (let i = 0; i < startDay; i++) {
      const date = addDays(startDate, -startDay + i);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: true
      });
    }
    
    // Add days of current month
    while (currentDate <= endDate) {
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: true,
        isDisabled: currentDate < new Date().setHours(0, 0, 0, 0) // Disable past dates
      });
      currentDate = addDays(currentDate, 1);
    }
    
    // Add days from next month to fill the last week
    const endDay = endDate.getDay();
    for (let i = 1; i < 7 - endDay; i++) {
      const date = addDays(endDate, i);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: true
      });
    }
    
    return days;
  };

  // Fetch available slots when date changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDate) return;
      
      try {
        setLoading(true);
        setError('');
        
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const response = await api.get('/api/appointments/available-slots', {
          params: {
            bloodBankId,
            date: dateStr,
            duration: 30 // 30-minute slots
          }
        });
        
        setAvailableSlots(response.data.data || []);
        setSelectedTime(null);
      } catch (err) {
        console.error('Error fetching available slots:', err);
        setError('Failed to load available time slots. Please try again.');
        setAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailableSlots();
  }, [selectedDate, bloodBankId]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (day) => {
    if (day.isDisabled) return;
    onDateChange(day.date);
  };

  const handleTimeSelect = (timeSlot) => {
    setSelectedTime(timeSlot);
    if (onSelectSlot) {
      onSelectSlot({
        date: selectedDate,
        startTime: timeSlot.startStr,
        endTime: timeSlot.endStr
      });
    }
  };

  const days = generateDays();
  const monthYear = format(currentMonth, 'MMMM yyyy');

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Select Date & Time</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <span className="font-medium">{monthYear}</span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 p-2 text-center text-sm font-medium text-gray-500">
        {daysOfWeek.map(day => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 p-2">
        {days.map((day, idx) => {
          const isSelected = selectedDate && isSameDay(day.date, selectedDate);
          const isToday = isSameDay(day.date, new Date());
          
          return (
            <button
              key={idx}
              onClick={() => handleDateSelect(day)}
              disabled={day.isDisabled}
              className={`
                h-12 rounded-md flex items-center justify-center text-sm font-medium
                ${day.isDisabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                ${isSelected ? 'bg-blue-100 text-blue-700' : ''}
                ${isToday && !isSelected ? 'border border-blue-300' : ''}
              `}
            >
              {format(day.date, 'd')}
            </button>
          );
        })}
      </div>
      
      <div className="p-4 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Available Time Slots
        </h4>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm py-2">{error}</div>
        ) : !selectedDate ? (
          <div className="text-gray-500 text-sm py-4 text-center">
            Select a date to see available time slots
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-gray-500 text-sm py-4 text-center">
            No available time slots for {format(selectedDate, 'MMMM d, yyyy')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableSlots.map((slot, idx) => (
              <button
                key={idx}
                onClick={() => handleTimeSelect(slot)}
                className={`
                  py-2 px-3 rounded-md text-sm font-medium text-center
                  ${selectedTime?.startStr === slot.startStr
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }
                `}
              >
                {slot.startStr} - {slot.endStr}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {selectedDate && selectedTime && (
        <div className="p-4 bg-blue-50 border-t border-blue-100">
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-gray-600">
                {selectedTime.startStr} - {selectedTime.endStr}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;
