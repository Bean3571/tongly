package handlers

import (
	"fmt"
	"time"
	"video-service/pkg/chat"
	w "video-service/pkg/webrtc"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/pion/webrtc/v3"
)

// RoomCreateWithID creates a new room with a specific ID (for lessons)
func RoomCreateWithID(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	if uuid == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Room ID is required",
		})
	}

	uuid, _ = createOrGetRoom(uuid)
	return c.JSON(fiber.Map{
		"success": true,
		"room_id": uuid,
	})
}

// RoomExists checks if a room exists
func RoomExists(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	if uuid == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Room ID is required",
		})
	}

	w.RoomsLock.RLock()
	_, exists := w.Rooms[uuid]
	w.RoomsLock.RUnlock()

	return c.JSON(fiber.Map{
		"exists": exists,
	})
}

// RoomWebsocket handles WebSocket connections for the room
func RoomWebsocket(c *websocket.Conn) {
	uuid := c.Params("uuid")
	if uuid == "" {
		return
	}

	_, room := createOrGetRoom(uuid)
	w.RoomConn(c, room.Peers)
}

// createOrGetRoom creates a new room or returns an existing one
func createOrGetRoom(uuid string) (string, *w.Room) {
	w.RoomsLock.Lock()
	defer w.RoomsLock.Unlock()

	if room := w.Rooms[uuid]; room != nil {
		return uuid, room
	}

	hub := chat.NewHub()
	p := &w.Peers{}
	p.TrackLocals = make(map[string]*webrtc.TrackLocalStaticRTP)
	room := &w.Room{
		Peers:     p,
		Hub:       hub,
		CreatedAt: time.Now(),
	}

	w.Rooms[uuid] = room
	go hub.Run()
	return uuid, room
}

type websocketMessage struct {
	Event string `json:"event"`
	Data  string `json:"data"`
}

// RoomVideoOnly renders the video-only component for a room
func RoomVideoOnly(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	if uuid == "" {
		c.Status(400)
		return nil
	}

	// Determine WebSocket scheme based on request protocol
	wsScheme := "ws"
	if c.Protocol() == "https" {
		wsScheme = "wss"
	}

	uuid, _ = createOrGetRoom(uuid)

	// Return HTML template with video only
	return c.Render("video", fiber.Map{
		"RoomWebsocketAddr": fmt.Sprintf("%s://%s/api/room/%s/video/websocket", wsScheme, c.Hostname(), uuid),
	}, "")
}

// RoomChatOnly renders the chat-only component for a room
func RoomChatOnly(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	if uuid == "" {
		c.Status(400)
		return nil
	}

	// Determine WebSocket scheme based on request protocol
	wsScheme := "ws"
	if c.Protocol() == "https" {
		wsScheme = "wss"
	}

	uuid, _ = createOrGetRoom(uuid)

	// Return HTML template with chat only
	return c.Render("chat", fiber.Map{
		"ChatWebsocketAddr": fmt.Sprintf("%s://%s/api/room/%s/chat/websocket", wsScheme, c.Hostname(), uuid),
	}, "")
}
