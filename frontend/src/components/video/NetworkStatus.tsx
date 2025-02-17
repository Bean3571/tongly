import React from 'react';
import styled from 'styled-components';
import { NetworkQuality } from '@/types/webrtc';

interface NetworkStatusProps {
  quality: NetworkQuality;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ quality }) => {
  const getStatusIcon = () => {
    switch (quality) {
      case 'good':
        return '📶';
      case 'fair':
        return '📡';
      case 'poor':
        return '⚠️';
      default:
        return '❓';
    }
  };

  return (
    <Container $quality={quality}>
      {getStatusIcon()}
      <StatusText>{quality.toUpperCase()}</StatusText>
    </Container>
  );
};

const Container = styled.div<{ $quality: NetworkQuality }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.5);
  color: ${(props) =>
    props.$quality === 'good' ? 'var(--success)' :
    props.$quality === 'fair' ? 'var(--warning)' : 'var(--error)'
  };
`;

const StatusText = styled.span`
  font-size: 0.8rem;
  font-weight: 500;
`;

export default NetworkStatus; 