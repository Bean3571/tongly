import React, { useEffect } from 'react';
import styled from 'styled-components';

interface StreamViewProps {
  localStream: MediaStream | null;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  peerStreams: Map<number, { stream: MediaStream; isScreenShare: boolean }>;
  activeView: 'remote-camera' | 'remote-screen' | 'local-camera' | 'local-screen';
  setActiveView: (view: 'remote-camera' | 'remote-screen' | 'local-camera' | 'local-screen') => void;
}

const StreamView: React.FC<StreamViewProps> = ({
  localStream,
  localVideoRef,
  peerStreams,
  activeView,
  setActiveView,
}) => {
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const renderStreamSelector = () => (
    <StreamSelector>
      <StreamButton 
        active={activeView === 'remote-camera'} 
        onClick={() => setActiveView('remote-camera')}
      >
        Participant Camera
      </StreamButton>
      <StreamButton 
        active={activeView === 'remote-screen'} 
        onClick={() => setActiveView('remote-screen')}
        disabled={!Array.from(peerStreams.values()).some(peer => peer.isScreenShare)}
      >
        Participant Screen
      </StreamButton>
      <StreamButton 
        active={activeView === 'local-camera'} 
        onClick={() => setActiveView('local-camera')}
      >
        My Camera
      </StreamButton>
      <StreamButton 
        active={activeView === 'local-screen'} 
        onClick={() => setActiveView('local-screen')}
      >
        My Screen
      </StreamButton>
    </StreamSelector>
  );

  const renderMainStream = () => {
    switch (activeView) {
      case 'remote-camera':
        return Array.from(peerStreams.entries())
          .filter(([_, { isScreenShare }]) => !isScreenShare)
          .map(([peerId, { stream }]) => (
            <MainVideoContainer key={peerId}>
              <VideoElement
                ref={el => {
                  if (el) {
                    el.srcObject = stream;
                  }
                }}
                autoPlay
                playsInline
              />
              <StreamTitle>Participant Camera</StreamTitle>
            </MainVideoContainer>
          ));

      case 'remote-screen':
        return Array.from(peerStreams.entries())
          .filter(([_, { isScreenShare }]) => isScreenShare)
          .map(([peerId, { stream }]) => (
            <MainVideoContainer key={`${peerId}-screen`}>
              <VideoElement
                ref={el => {
                  if (el) {
                    el.srcObject = stream;
                  }
                }}
                autoPlay
                playsInline
              />
              <StreamTitle>Participant Screen</StreamTitle>
            </MainVideoContainer>
          ));

      case 'local-camera':
        return (
          <MainVideoContainer>
            <VideoElement
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
            />
            <StreamTitle>My Camera</StreamTitle>
          </MainVideoContainer>
        );

      case 'local-screen':
        return (
          <MainVideoContainer>
            <VideoElement
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
            />
            <StreamTitle>My Screen</StreamTitle>
          </MainVideoContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Container>
      {renderStreamSelector()}
      <MainView>
        {renderMainStream()}
      </MainView>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  width: 100%;
`;

const MainView = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
  overflow: auto;
`;

const StreamSelector = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin: 1rem;
`;

const StreamButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: ${props => props.active ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  cursor: pointer;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover:not(:disabled) {
    background: ${props => props.active ? 'var(--primary-dark)' : 'rgba(255, 255, 255, 0.2)'};
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const MainVideoContainer = styled.div`
  position: relative;
  background: var(--bg-darker);
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16/9;
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StreamTitle = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
`;

export default StreamView; 