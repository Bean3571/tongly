import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Message {
  id: number;
  lessonId: number;
  senderId: number;
  content: string;
  createdAt: string;
  senderName: string;
}

interface LessonChatProps {
  lessonId: number;
  userId: number;
  participants: {
    id: number;
    name: string;
  }[];
}

const LessonChat: React.FC<LessonChatProps> = ({ lessonId, userId, participants }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [lessonId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/lessons/${lessonId}/chat`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to load chat history');
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/lessons/${lessonId}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getParticipantName = (participantId: number) => {
    const participant = participants.find(p => p.id === participantId);
    return participant ? participant.name : 'Unknown';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await sendMessage(newMessage.trim());
  };

  if (isLoading) {
    return <LoadingContainer>Loading chat history...</LoadingContainer>;
  }

  return (
    <Container>
      <Header>
        <Title>Lesson Chat</Title>
        <ParticipantCount>{participants.length} participants</ParticipantCount>
      </Header>

      <MessageList>
        {messages.map(message => (
          <MessageContainer
            key={message.id}
            isOwnMessage={message.senderId === userId}
          >
            <MessageContent isOwnMessage={message.senderId === userId}>
              <SenderName>{getParticipantName(message.senderId)}</SenderName>
              <MessageText>{message.content}</MessageText>
              <MessageTime>{formatTime(message.createdAt)}</MessageTime>
            </MessageContent>
          </MessageContainer>
        ))}
        <div ref={messagesEndRef} />
      </MessageList>

      <MessageForm onSubmit={handleSubmit}>
        <MessageInput
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          maxLength={500}
        />
        <SendButton type="submit" disabled={!newMessage.trim()}>
          Send
        </SendButton>
      </MessageForm>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  padding: 1rem;
  background: #4a90e2;
  color: white;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.2rem;
`;

const ParticipantCount = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MessageContainer = styled.div<{ isOwnMessage: boolean }>`
  display: flex;
  justify-content: ${props => props.isOwnMessage ? 'flex-end' : 'flex-start'};
  margin-bottom: 0.5rem;
`;

const MessageContent = styled.div<{ isOwnMessage: boolean }>`
  max-width: 70%;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  background: ${props => props.isOwnMessage ? '#4a90e2' : '#f0f0f0'};
  color: ${props => props.isOwnMessage ? 'white' : 'black'};
`;

const SenderName = styled.div`
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 0.2rem;
`;

const MessageText = styled.div`
  word-wrap: break-word;
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  opacity: 0.7;
  text-align: right;
  margin-top: 0.2rem;
`;

const MessageForm = styled.form`
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8f9fa;
`;

const MessageInput = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  min-height: 60px;
`;

const SendButton = styled.button`
  padding: 0.5rem 1.5rem;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #357abd;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
`;

export default LessonChat; 