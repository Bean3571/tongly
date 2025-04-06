package interfaces

import (
	"encoding/json"
	"net/http"
	"strconv"
	"sync"
	"time"

	"tongly-backend/internal/logger"
	"tongly-backend/internal/usecases"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 8192
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow connections from any origin for development - should be restricted in production
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Client represents a connected websocket client
type Client struct {
	// The websocket connection
	conn *websocket.Conn

	// Buffered channel of outbound messages
	send chan []byte

	// The room this client belongs to
	room *Room

	// User information
	userID int
	role   string
}

// Room represents a video call room for a lesson
type Room struct {
	// Room ID is the lesson ID
	roomID int

	// Registered clients
	clients map[*Client]bool

	// Inbound messages from the clients
	broadcast chan []byte

	// Register requests from the clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for synchronizing access to the clients map
	mutex sync.Mutex
}

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	authUseCase      *usecases.AuthUseCase
	videoCallUseCase *usecases.VideoCallUseCase

	// Map of rooms keyed by lesson ID
	rooms map[int]*Room

	// Mutex for synchronizing access to the rooms map
	roomsMutex sync.Mutex
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(authUseCase *usecases.AuthUseCase, videoCallUseCase *usecases.VideoCallUseCase) *WebSocketHandler {
	return &WebSocketHandler{
		authUseCase:      authUseCase,
		videoCallUseCase: videoCallUseCase,
		rooms:            make(map[int]*Room),
	}
}

// GetRoom returns a room for a lesson or creates one if it doesn't exist
func (h *WebSocketHandler) GetRoom(lessonID int) *Room {
	h.roomsMutex.Lock()
	defer h.roomsMutex.Unlock()

	if room, ok := h.rooms[lessonID]; ok {
		return room
	}

	room := &Room{
		roomID:     lessonID,
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}

	h.rooms[lessonID] = room

	// Start room goroutine
	go room.run()

	return room
}

// Run manages a room
func (r *Room) run() {
	for {
		select {
		case client := <-r.register:
			r.mutex.Lock()
			r.clients[client] = true
			r.mutex.Unlock()

			// Notify all clients that a new user has joined
			userJoinedMsg := map[string]interface{}{
				"type":      "user-joined",
				"user":      client.userID,
				"role":      client.role,
				"timestamp": time.Now().Unix(),
			}

			msgBytes, _ := json.Marshal(userJoinedMsg)
			r.broadcast <- msgBytes

		case client := <-r.unregister:
			r.mutex.Lock()
			if _, ok := r.clients[client]; ok {
				delete(r.clients, client)
				close(client.send)
			}
			r.mutex.Unlock()

			// If there are no more clients, clean up the room
			r.mutex.Lock()
			if len(r.clients) == 0 {
				logger.Info("All clients left room", "roomID", r.roomID)
			}
			r.mutex.Unlock()

		case message := <-r.broadcast:
			r.mutex.Lock()
			for client := range r.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(r.clients, client)
				}
			}
			r.mutex.Unlock()
		}
	}
}

// HandleRTCWebSocket handles WebSocket connections for WebRTC signaling
func (h *WebSocketHandler) HandleRTCWebSocket(c *gin.Context) {
	// Get lesson ID from URL
	lessonIDStr := c.Param("id")
	lessonID, err := strconv.Atoi(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lesson ID"})
		return
	}

	// Get and validate token from query string
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authentication token"})
		return
	}

	// Validate token against the lesson (in a real implementation, this would verify against stored tokens)
	lesson, err := h.videoCallUseCase.ValidateToken(lessonID, token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	// Get user ID and role from the validated lesson
	var userID int
	var role string

	if token == *lesson.JoinTokenStudent {
		userID = lesson.StudentID
		role = "student"
	} else if token == *lesson.JoinTokenTutor {
		userID = lesson.TutorID
		role = "tutor"
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	// Get or create the room for this lesson
	room := h.GetRoom(lessonID)

	// Upgrade the HTTP connection to a WebSocket connection
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logger.Error("Failed to upgrade to WebSocket", "error", err)
		return
	}

	// Create a new client
	client := &Client{
		conn:   conn,
		send:   make(chan []byte, 256),
		room:   room,
		userID: userID,
		role:   role,
	}

	// Register the client with the room
	room.register <- client

	// Allow collection of memory referenced by the caller by doing all work in new goroutines
	go client.writePump()
	go client.readPump()

	logger.Info("New WebSocket client connected", "lessonID", lessonID, "userID", userID, "role", role)
}

// ReadPump pumps messages from the WebSocket connection to the Room
func (c *Client) readPump() {
	defer func() {
		c.room.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logger.Warn("WebSocket error", "error", err)
			}
			break
		}

		// Parse the message to add sender information
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err != nil {
			logger.Error("Failed to parse WebSocket message", "error", err)
			continue
		}

		// Add sender information
		msg["sender"] = c.userID
		msg["role"] = c.role
		msg["timestamp"] = time.Now().Unix()

		// Marshal the message back to JSON
		message, err = json.Marshal(msg)
		if err != nil {
			logger.Error("Failed to marshal WebSocket message", "error", err)
			continue
		}

		// Broadcast the message to all clients in the room
		c.room.broadcast <- message
	}
}

// WritePump pumps messages from the Room to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The Room closed the channel
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current WebSocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// RegisterRoutes registers the WebSocket routes
func (h *WebSocketHandler) RegisterRoutes(r *gin.Engine) {
	wsGroup := r.Group("/api/ws")
	{
		wsGroup.GET("/lessons/:id/rtc", h.HandleRTCWebSocket)
	}
}
