import React from 'react';
import { VideoPlayer } from './VideoPlayer';

interface ParticipantTileProps {
  stream?: MediaStream;
  name: string;
  isMirrored?: boolean;
  isSelf?: boolean;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  stream,
  name,
  isMirrored = false,
  isSelf = false,
}) => {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg bg-surface-dark">
      {stream ? (
        <VideoPlayer stream={stream} isMirrored={isMirrored} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-4xl">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      
      {/* Participant name label */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded-md">
        {name} {isSelf && '(You)'}
      </div>
    </div>
  );
}; 