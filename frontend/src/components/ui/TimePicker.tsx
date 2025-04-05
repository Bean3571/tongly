import React from 'react';
import classNames from 'classnames';

interface TimePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  error,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      <input
        type="time"
        className={classNames(
          'block w-full rounded-md shadow-sm focus:border-accent-primary focus:ring focus:ring-accent-primary focus:ring-opacity-50',
          {
            'border-red-500': error,
            'border-gray-300': !error
          },
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}; 