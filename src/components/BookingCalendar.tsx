import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BookedDate {
  start_date: string;
  end_date: string;
  status: string;
}

interface BookingCalendarProps {
  bookedDates: BookedDate[];
  onDateChange: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
  isLoading?: boolean;
  showUnavailableDates?: boolean;
}

export default function BookingCalendar({
  bookedDates,
  onDateChange,
  initialStartDate,
  initialEndDate,
  isLoading = false,
  showUnavailableDates = false
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('start');
  const [hasInitialized, setHasInitialized] = useState(false);

  const bookedDateRanges = bookedDates
    .filter(date => date.status === 'confirmed' || date.status === 'pending')
    .map(date => ({
      start: new Date(date.start_date),
      end: new Date(date.end_date),
      status: date.status
    }));

  useEffect(() => {
    if (!hasInitialized && (initialStartDate || initialEndDate)) {
      if (initialStartDate) {
        setSelectedStartDate(new Date(initialStartDate));
      }
      if (initialEndDate) {
        setSelectedEndDate(new Date(initialEndDate));
      }
      setHasInitialized(true);
    }
  }, [initialStartDate, initialEndDate, hasInitialized]);

  useEffect(() => {
    if (selectedStartDate && selectedEndDate) {
      const startDateStr = selectedStartDate.toISOString().split('T')[0];
      const endDateStr = selectedEndDate.toISOString().split('T')[0];
      
      if (startDateStr !== initialStartDate || endDateStr !== initialEndDate) {
        onDateChange(startDateStr, endDateStr);
      }
    }
  }, [selectedStartDate, selectedEndDate, onDateChange, initialStartDate, initialEndDate]);

  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const isDateInPast = (date: Date) => {
    const today = getToday();
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck < today;
  };

  const isDateBooked = (date: Date) => {
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    return bookedDateRanges.some(range => {
      const start = new Date(range.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(range.end);
      end.setHours(0, 0, 0, 0);
      
      return dateToCheck >= start && dateToCheck <= end;
    });
  };

  const isDateSelectable = (date: Date) => {
    const now = new Date();
    const today = getToday();
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);

    // If date is in the past, it's not selectable
    if (dateToCheck < today) {
      return false;
    }

    // If date is today, check if it's before 6 PM
    if (dateToCheck.getTime() === today.getTime()) {
      return now.getHours() < 18;
    }

    // Check if date is booked
    return !isDateBooked(date);
  };

  const findNextAvailableDate = (startDate: Date): Date => {
    let nextDate = new Date(startDate);
    nextDate.setHours(0, 0, 0, 0);
    
    if (isDateSelectable(nextDate)) {
      return nextDate;
    }
    
    let maxIterations = 365;
    while (maxIterations > 0) {
      nextDate.setDate(nextDate.getDate() + 1);
      if (isDateSelectable(nextDate)) {
        return nextDate;
      }
      maxIterations--;
    }
    
    return startDate;
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.getDay();
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const isInSelectionRange = (date: Date) => {
    if (!selectedStartDate) return false;
    
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    if (selectionMode === 'end' && hoverDate) {
      const start = new Date(selectedStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(hoverDate);
      end.setHours(0, 0, 0, 0);
      
      return dateToCheck >= start && dateToCheck <= end;
    }
    
    if (selectedEndDate) {
      const start = new Date(selectedStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedEndDate);
      end.setHours(0, 0, 0, 0);
      
      return dateToCheck >= start && dateToCheck <= end;
    }
    
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (!isDateSelectable(date)) return;
    
    if (selectionMode === 'start') {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setSelectionMode('end');
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const nextAvailableDate = findNextAvailableDate(nextDay);
      setSelectedEndDate(nextAvailableDate);
    } else {
      if (selectedStartDate && date < selectedStartDate) {
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(date);
      } else {
        setSelectedEndDate(date);
      }
      setSelectionMode('start');
    }
  };

  const handleDateHover = (date: Date) => {
    if (selectionMode === 'end' && selectedStartDate) {
      setHoverDate(date);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const days = [];
    
    const prevMonthDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    for (let i = prevMonthDays; i > 0; i--) {
      const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), -i + 1);
      days.push(
        <div key={`prev-${i}`} className="text-gray-300 p-2 text-center">
          {prevMonthDate.getDate()}
        </div>
      );
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const isSelectable = isDateSelectable(date);
      const isStart = selectedStartDate && date.getTime() === selectedStartDate.getTime();
      const isEnd = selectedEndDate && date.getTime() === selectedEndDate.getTime();
      const isInRange = isInSelectionRange(date);
      const isBooked = isDateBooked(date);
      const isPast = isDateInPast(date);
      
      days.push(
        <div
          key={i}
          onClick={() => isSelectable && handleDateClick(date)}
          onMouseEnter={() => isSelectable && handleDateHover(date)}
          className={`
            p-2 text-center relative cursor-pointer
            ${isSelectable 
              ? 'hover:bg-primary hover:text-white' 
              : 'cursor-not-allowed'}
            ${isStart ? 'bg-primary text-white rounded-l-full' : ''}
            ${isEnd ? 'bg-primary text-white rounded-r-full' : ''}
            ${isInRange && !isStart && !isEnd ? 'bg-primary/20' : ''}
            ${isBooked ? 'bg-red-100 text-red-800 cursor-not-allowed' : ''}
            ${isPast ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-700'}
          `}
        >
          {i}
          {isStart && isEnd && (
            <span className="absolute inset-0 rounded-full bg-primary z-0"></span>
          )}
        </div>
      );
    }
    
    const totalDays = days.length;
    const remainingDays = 42 - totalDays;
    
    for (let i = 1; i <= remainingDays; i++) {
      days.push(
        <div key={`next-${i}`} className="text-gray-300 p-2 text-center">
          {i}
        </div>
      );
    }
    
    return days;
  };

  useEffect(() => {
    if (!hasInitialized && !initialStartDate && !initialEndDate) {
      const today = getToday();
      const nextAvailableDate = findNextAvailableDate(today);
      setSelectedStartDate(nextAvailableDate);
      
      const dayAfter = new Date(nextAvailableDate);
      dayAfter.setDate(dayAfter.getDate() + 1);
      const nextEndDate = findNextAvailableDate(dayAfter);
      setSelectedEndDate(nextEndDate);
      
      setHasInitialized(true);
      
      onDateChange(
        nextAvailableDate.toISOString().split('T')[0],
        nextEndDate.toISOString().split('T')[0]
      );
    }
  }, [hasInitialized, initialStartDate, initialEndDate, onDateChange]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-medium text-gray-700 capitalize">
          {formatMonth(currentMonth)}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
      
      <div className="mt-4 flex items-center space-x-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-primary rounded-full mr-1"></div>
          <span>Sélectionné</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-100 rounded-full mr-1"></div>
          <span>Indisponible</span>
        </div>
      </div>
      
      {selectedStartDate && (
        <div className="mt-4 p-2 bg-gray-50 rounded text-sm">
          {selectedEndDate ? (
            <p>
              Du {selectedStartDate.toLocaleDateString()} au {selectedEndDate.toLocaleDateString()}
            </p>
          ) : (
            <p>Sélectionnez une date de fin</p>
          )}
        </div>
      )}
    </div>
  );
}