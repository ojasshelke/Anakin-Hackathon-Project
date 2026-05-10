'use client';
import React, { useState, useEffect, useCallback } from 'react';

const TIME_SLOTS = ['10:00 AM', '11:30 AM', '2:00 PM', '3:30 PM', '5:00 PM'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface BookedSlot { date: string; time: string; }

interface CalendarPickerProps {
  onSelect: (date: string, time: string) => void;
  loading?: boolean;
}

export default function CalendarPicker({ onSelect, loading }: CalendarPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate next 14 days (skip weekends)
  const availableDates: Date[] = [];
  const d = new Date(today);
  d.setDate(d.getDate() + 1); // Start from tomorrow
  while (availableDates.length < 14) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      availableDates.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }

  const fetchBookedSlots = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookedSlots(data.slots || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchBookedSlots(); }, [fetchBookedSlots]);

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const isSlotBooked = (dateKey: string, time: string) => {
    return bookedSlots.some(s => s.date === dateKey && s.time === time);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onSelect(selectedDate, selectedTime);
    }
  };

  // Group dates by week for display
  const currentMonth = availableDates.length > 0 ? availableDates[0].getMonth() : today.getMonth();
  const nextMonth = availableDates.length > 7 ? availableDates[availableDates.length - 1].getMonth() : currentMonth;
  const monthLabel = currentMonth === nextMonth
    ? MONTHS[currentMonth]
    : `${MONTHS[currentMonth]} – ${MONTHS[nextMonth]}`;

  return (
    <div className="space-y-6">
      {/* Month Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold text-foreground">{monthLabel} {availableDates[0]?.getFullYear()}</h4>
        <span className="text-xs font-mono text-muted-foreground">Select a date & time</span>
      </div>

      {/* Date Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {DAYS.map(day => (
          <div key={day} className="text-center text-xs font-mono text-muted-foreground py-1">{day}</div>
        ))}
        {/* Offset for first day */}
        {availableDates.length > 0 && Array.from({ length: availableDates[0].getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {availableDates.map((date) => {
          const dateKey = formatDateKey(date);
          const isSelected = selectedDate === dateKey;
          const dayOfMonth = date.getDate();
          return (
            <button
              key={dateKey}
              onClick={() => { setSelectedDate(dateKey); setSelectedTime(null); }}
              className={`relative h-10 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none ${
                isSelected
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-secondary/50 text-foreground hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {dayOfMonth}
              {isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="space-y-3" style={{ animation: 'animationIn 0.4s ease-out forwards' }}>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Available times</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TIME_SLOTS.map(time => {
              const booked = isSlotBooked(selectedDate, time);
              const isSelected = selectedTime === time;
              return (
                <button
                  key={time}
                  onClick={() => !booked && setSelectedTime(time)}
                  disabled={booked}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none border ${
                    booked
                      ? 'bg-muted/50 text-muted-foreground/40 border-border cursor-not-allowed line-through'
                      : isSelected
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-card text-foreground border-border hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  {time}
                  {booked && <span className="block text-[10px] mt-0.5 no-underline">Booked</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {selectedDate && selectedTime && (
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 disabled:opacity-70"
          style={{ animation: 'animationIn 0.3s ease-out forwards' }}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Confirming...
            </>
          ) : (
            <>
              Confirm Booking
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}
