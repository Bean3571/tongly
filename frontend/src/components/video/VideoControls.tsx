import React from 'react';
import styled from 'styled-components';

interface VideoControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  isScreenShareEnabled?: boolean;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isMuted,
  isVideoOff,
  isScreenSharing,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  isScreenShareEnabled = true,
}) => {
  return (
    <Container>
      <ControlButton onClick={onToggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
        {isMuted ? '🔇' : '🎤'}
      </ControlButton>
      <ControlButton onClick={onToggleVideo} title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}>
        {isVideoOff ? '📵' : '📹'}
      </ControlButton>
      {isScreenShareEnabled && (
        <ControlButton onClick={onToggleScreenShare} title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
          {isScreenSharing ? '🔄' : '💻'}
        </ControlButton>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const ControlButton = styled.button`
  background: var(--primary);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  color: white;
  display: grid;
  place-items: center;
  
  &:hover {
    background: var(--primary-dark);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export default VideoControls; 