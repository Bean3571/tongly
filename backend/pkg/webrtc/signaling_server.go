package webrtc

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// SignalMessage represents a WebRTC signaling message
type SignalMessage struct {
	Type    string          `json:"type"`
	From    int             `json:"from"`
	To      int             `json:"to"`
	Payload json.RawMessage `json:"payload"`
}

// Client represents a connected WebSocket client
type Client struct {
	ID     int
	Conn   *websocket.Conn
	Room   *Room
	mu     sync.Mutex
	closed bool
}

// Room represents a video session room
type Room struct {
	ID      string
	Clients map[int]*Client
	mu      sync.RWMutex
	OnClose func()
}

// SignalingServer handles WebRTC signaling
type SignalingServer struct {
	rooms    map[string]*Room
	mu       sync.RWMutex
	upgrader websocket.Upgrader
}

// NewSignalingServer creates a new signaling server
func NewSignalingServer() *SignalingServer {
	return &SignalingServer{
		rooms: make(map[string]*Room),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // In production, implement proper origin checking
			},
		},
	}
}

// HandleConnection handles a new WebSocket connection
func (s *SignalingServer) HandleConnection(roomID string, userID int, w http.ResponseWriter, r *http.Request) error {
	// Upgrade HTTP connection to WebSocket
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		return err
	}

	// Get or create room
	room := s.getOrCreateRoom(roomID)

	// Create client
	client := &Client{
		ID:   userID,
		Conn: conn,
		Room: room,
	}

	// Add client to room
	room.mu.Lock()
	room.Clients[userID] = client
	room.mu.Unlock()

	// Start handling messages
	go s.handleClientMessages(client)

	// Notify other clients about the new peer
	s.broadcastJoin(room, client)

	return nil
}

func (s *SignalingServer) getOrCreateRoom(roomID string) *Room {
	s.mu.Lock()
	defer s.mu.Unlock()

	if room, exists := s.rooms[roomID]; exists {
		return room
	}

	room := &Room{
		ID:      roomID,
		Clients: make(map[int]*Client),
		OnClose: func() {
			s.mu.Lock()
			delete(s.rooms, roomID)
			s.mu.Unlock()
		},
	}
	s.rooms[roomID] = room
	return room
}

func (s *SignalingServer) handleClientMessages(client *Client) {
	defer func() {
		client.Close()
		s.removeClient(client)
	}()

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error reading message: %v", err)
			}
			break
		}

		var signal SignalMessage
		if err := json.Unmarshal(message, &signal); err != nil {
			log.Printf("error unmarshaling message: %v", err)
			continue
		}

		signal.From = client.ID
		s.handleSignal(client, &signal)
	}
}

func (s *SignalingServer) handleSignal(client *Client, signal *SignalMessage) {
	room := client.Room

	switch signal.Type {
	case "offer", "answer", "ice-candidate":
		// Forward the signal to the specified peer
		room.mu.RLock()
		targetClient, exists := room.Clients[signal.To]
		room.mu.RUnlock()

		if exists {
			s.sendSignal(targetClient, signal)
		}

	case "get-peers":
		// Send list of connected peers to the client
		peers := make([]int, 0)
		room.mu.RLock()
		for peerID := range room.Clients {
			if peerID != client.ID {
				peers = append(peers, peerID)
			}
		}
		room.mu.RUnlock()

		s.sendSignal(client, &SignalMessage{
			Type:    "peers",
			From:    -1,
			Payload: json.RawMessage(marshalPeers(peers)),
		})
	}
}

func (s *SignalingServer) broadcastJoin(room *Room, client *Client) {
	signal := &SignalMessage{
		Type: "peer-joined",
		From: client.ID,
	}

	room.mu.RLock()
	defer room.mu.RUnlock()

	for _, peer := range room.Clients {
		if peer.ID != client.ID {
			s.sendSignal(peer, signal)
		}
	}
}

func (s *SignalingServer) removeClient(client *Client) {
	room := client.Room
	room.mu.Lock()
	delete(room.Clients, client.ID)
	isEmpty := len(room.Clients) == 0
	room.mu.Unlock()

	if isEmpty && room.OnClose != nil {
		room.OnClose()
	}

	// Notify other clients about peer departure
	signal := &SignalMessage{
		Type: "peer-left",
		From: client.ID,
	}

	room.mu.RLock()
	for _, peer := range room.Clients {
		s.sendSignal(peer, signal)
	}
	room.mu.RUnlock()
}

func (s *SignalingServer) sendSignal(client *Client, signal *SignalMessage) {
	client.mu.Lock()
	defer client.mu.Unlock()

	if client.closed {
		return
	}

	data, err := json.Marshal(signal)
	if err != nil {
		log.Printf("error marshaling signal: %v", err)
		return
	}

	if err := client.Conn.WriteMessage(websocket.TextMessage, data); err != nil {
		log.Printf("error sending signal: %v", err)
		client.Close()
	}
}

func (c *Client) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if !c.closed {
		c.closed = true
		c.Conn.Close()
	}
}

func marshalPeers(peers []int) []byte {
	data, _ := json.Marshal(peers)
	return data
}
