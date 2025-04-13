package handlers

import (
	"fmt"
	"video-service/pkg/chat"
	w "video-service/pkg/webrtc"

	"crypto/sha256"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	guuid "github.com/google/uuid"
	"github.com/pion/webrtc/v3"
)

func RoomCreate(c *fiber.Ctx) error {
	return c.Redirect(fmt.Sprintf("/room/%s", guuid.New().String()))
}

func Room(c *fiber.Ctx) error {
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

	uuid, suuid, _ := createOrGetRoom(uuid)
	return c.Render("peer", fiber.Map{
		"RoomWebsocketAddr": fmt.Sprintf("%s://%s/room/%s/websocket", wsScheme, c.Hostname(), uuid),
		"RoomLink":          fmt.Sprintf("%s://%s/room/%s", c.Protocol(), c.Hostname(), uuid),
		"ChatWebsocketAddr": fmt.Sprintf("%s://%s/room/%s/chat/websocket", wsScheme, c.Hostname(), uuid),
		"StreamLink":        fmt.Sprintf("%s://%s/stream/%s", c.Protocol(), c.Hostname(), suuid),
		"Type":              "room",
	}, "layouts/main")
}

func RoomWebsocket(c *websocket.Conn) {
	uuid := c.Params("uuid")
	if uuid == "" {
		return
	}

	_, _, room := createOrGetRoom(uuid)
	w.RoomConn(c, room.Peers)
}

func createOrGetRoom(uuid string) (string, string, *w.Room) {
	w.RoomsLock.Lock()
	defer w.RoomsLock.Unlock()

	h := sha256.New()
	h.Write([]byte(uuid))
	suuid := fmt.Sprintf("%x", h.Sum(nil))

	if room := w.Rooms[uuid]; room != nil {
		if _, ok := w.Streams[suuid]; !ok {
			w.Streams[suuid] = room
		}
		return uuid, suuid, room
	}

	hub := chat.NewHub()
	p := &w.Peers{}
	p.TrackLocals = make(map[string]*webrtc.TrackLocalStaticRTP)
	room := &w.Room{
		Peers: p,
		Hub:   hub,
	}

	w.Rooms[uuid] = room
	w.Streams[suuid] = room

	go hub.Run()
	return uuid, suuid, room
}

type websocketMessage struct {
	Event string `json:"event"`
	Data  string `json:"data"`
}
