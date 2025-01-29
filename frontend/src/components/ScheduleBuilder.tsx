import React, { useState } from 'react';
import { AvailabilitySlot } from '../types';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
});

interface ScheduleBuilderProps {
    availability: AvailabilitySlot[];
    onChange: (availability: AvailabilitySlot[]) => void;
}

export const ScheduleBuilder: React.FC<ScheduleBuilderProps> = ({ availability, onChange }) => {
    const [selectedDay, setSelectedDay] = useState<number>(1); // Monday by default
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');

    const handleAddTimeSlot = () => {
        if (startTime >= endTime) {
            return; // Invalid time range
        }

        // Check for overlapping slots
        const hasOverlap = availability.some(slot => 
            slot.day_of_week === selectedDay &&
            ((startTime >= slot.start_time && startTime < slot.end_time) ||
             (endTime > slot.start_time && endTime <= slot.end_time) ||
             (startTime <= slot.start_time && endTime >= slot.end_time))
        );

        if (hasOverlap) {
            return; // Overlapping slots not allowed
        }

        const newSlot: AvailabilitySlot = {
            day_of_week: selectedDay,
            start_time: startTime,
            end_time: endTime,
            is_recurring: true,
            preset_type: 'custom'
        };

        onChange([...availability, newSlot].sort((a, b) => 
            a.day_of_week === b.day_of_week 
                ? a.start_time.localeCompare(b.start_time)
                : a.day_of_week - b.day_of_week
        ));
    };

    const handleRemoveTimeSlot = (slot: AvailabilitySlot) => {
        onChange(availability.filter(s => 
            !(s.day_of_week === slot.day_of_week && 
              s.start_time === slot.start_time && 
              s.end_time === slot.end_time)
        ));
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${period}`;
    };

    return (
        <div className="space-y-6">
            {/* Day selector */}
            <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day, index) => (
                    <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(index)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            selectedDay === index
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Time selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Start Time
                    </label>
                    <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                                 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    >
                        {TIME_SLOTS.map(time => (
                            <option key={time} value={time}>
                                {formatTime(time)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        End Time
                    </label>
                    <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                                 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    >
                        {TIME_SLOTS.map(time => (
                            <option key={time} value={time}>
                                {formatTime(time)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <button
                type="button"
                onClick={handleAddTimeSlot}
                disabled={startTime >= endTime}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm 
                         font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none 
                         focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 
                         disabled:cursor-not-allowed"
            >
                Add Time Slot
            </button>

            {/* Display schedule */}
            <div className="space-y-4">
                {DAYS_OF_WEEK.map((day, dayIndex) => {
                    const daySlots = availability.filter(slot => slot.day_of_week === dayIndex);
                    if (daySlots.length === 0) return null;

                    return (
                        <div key={day} className="space-y-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">{day}</h3>
                            <div className="space-y-2">
                                {daySlots.map((slot, index) => (
                                    <div
                                        key={`${slot.day_of_week}-${slot.start_time}-${index}`}
                                        className="flex items-center justify-between p-2 bg-gray-50 
                                                 dark:bg-gray-700 rounded-lg"
                                    >
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTimeSlot(slot)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ScheduleBuilder; 