import { envConfig } from '../config/env';

// Room API base URL - this is the video-service URL where WebRTC services are hosted
// We need to use the frontend URL with /api/room path which will be proxied to the video-service
const VIDEO_API_URL = process.env.REACT_APP_FRONTEND_URL || 'https://192.168.0.100';

// Interface for room information
export interface RoomInfo {
  id: string;
  participants: number;
  created_at: string;
}

// Check if a room exists
export const checkRoomExists = async (lessonId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${VIDEO_API_URL}/api/room/${lessonId}/exists`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking if room exists:', error);
    // Return false instead of throwing an error, so we'll attempt to create the room
    return false;
  }
};

// Join a room (creates it if it doesn't exist)
export const joinRoom = async (lessonId: string): Promise<void> => {
  try {
    // First, check if we need to create the room
    let roomExists = false;
    try {
      roomExists = await checkRoomExists(lessonId);
    } catch (error) {
      console.error('Error checking room existence, will try to create:', error);
    }
    
    if (!roomExists) {
      // Create the room if it doesn't exist
      try {
        await fetch(`${VIDEO_API_URL}/api/room/create/${lessonId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Error creating room, will try to connect anyway:', error);
      }
    }
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
};

// Get room video connection info
export const getRoomVideoInfo = async (lessonId: string): Promise<{ room_id: string; video_websocket_url: string }> => {
  try {
    const response = await fetch(`${VIDEO_API_URL}/api/room/${lessonId}/video`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting video room info:', error);
    throw error;
  }
};

// Get room chat connection info
export const getRoomChatInfo = async (lessonId: string): Promise<{ room_id: string; chat_websocket_url: string }> => {
  try {
    const response = await fetch(`${VIDEO_API_URL}/api/room/${lessonId}/chat`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting chat room info:', error);
    throw error;
  }
};

// Get WebSocket URL for the room
export const getRoomWebsocketUrl = (lessonId: string): string => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const videoServerUrl = new URL(VIDEO_API_URL);
  return `${wsProtocol}://${videoServerUrl.host}/room/${lessonId}/websocket`;
};

// Get chat WebSocket URL for the room
export const getRoomChatWebsocketUrl = (lessonId: string): string => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const videoServerUrl = new URL(VIDEO_API_URL);
  return `${wsProtocol}://${videoServerUrl.host}/room/${lessonId}/chat/websocket`;
}; 