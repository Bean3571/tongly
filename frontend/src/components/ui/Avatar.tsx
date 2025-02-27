import React from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, className = '', ...props }) => {
  const initials = alt
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-gray-200 text-gray-600 ${className}`}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span className="text-sm font-medium">{initials}</span>
      )}
    </div>
  );
}; 