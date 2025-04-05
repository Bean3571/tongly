import React from 'react';
import classNames from 'classnames';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  error,
  children,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      <select
        className={classNames(
          'block w-full rounded-md shadow-sm focus:border-accent-primary focus:ring focus:ring-accent-primary focus:ring-opacity-50',
          {
            'border-red-500': error,
            'border-gray-300': !error
          },
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
