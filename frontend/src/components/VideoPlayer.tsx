import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  stream?: MediaStream;
  isMirrored?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  stream, 
  isMirrored = false 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800">
        <div className="text-white">No video available</div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
    />
  );
}; 