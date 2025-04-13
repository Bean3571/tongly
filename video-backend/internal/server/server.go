package server

import (
	"flag"
	"log"
	"os"
	"time"

	"video-service/internal/handlers"
	w "video-service/pkg/webrtc"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/template/html"
	"github.com/gofiber/websocket/v2"
)

var (
	addr = flag.String("addr", "192.168.0.100:8081", "")
	cert = flag.String("cert", "", "Certificate file path")
	key  = flag.String("key", "", "Key file path")
)

func Run() error {
	flag.Parse()

	if *addr == ":" {
		*addr = ":8081"
	}

	// Set default certificate and key files if flags were not provided
	if *cert == "" {
		*cert = "../certs/cert.pem"
	}
	if *key == "" {
		*key = "../certs/key.pem"
	}

	engine := html.New("./views", ".html")
	app := fiber.New(fiber.Config{Views: engine})
	app.Use(logger.New())

	// Use a more permissive CORS configuration for development
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "https://192.168.0.100:3000, https://192.168.0.106:3000, https://192.168.0.107:3000, https://192.168.0.108:3000,https://localhost:3000,http://localhost:3000",
		AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	app.Get("/", handlers.Welcome)
	app.Get("/room/create", handlers.RoomCreate)
	app.Get("/room/:uuid", handlers.Room)
	app.Get("/room/:uuid/websocket", websocket.New(handlers.RoomWebsocket, websocket.Config{
		HandshakeTimeout: 10 * time.Second,
	}))
	app.Get("/room/:uuid/chat", handlers.RoomChat)
	app.Get("/room/:uuid/chat/websocket", websocket.New(handlers.RoomChatWebsocket))
	app.Get("/stream/:suuid", handlers.Stream)
	app.Get("/stream/:suuid/websocket", websocket.New(handlers.StreamWebsocket, websocket.Config{
		HandshakeTimeout: 10 * time.Second,
	}))
	app.Get("/stream/:suuid/chat/websocket", websocket.New(handlers.StreamChatWebsocket))

	// API endpoints
	app.Get("/api/room/:uuid/exists", handlers.RoomExists)
	app.Post("/api/room/create/:uuid", handlers.RoomCreateWithID)
	app.Get("/api/room/:uuid/info", handlers.RoomInfo)

	app.Static("/", "./assets")

	w.Rooms = make(map[string]*w.Room)
	w.Streams = make(map[string]*w.Room)
	go dispatchKeyFrames()
	log.Printf("Attempting to listen on: %s\n", *addr)
	if *cert != "" && *key != "" {
		// Check if the files exist before attempting to use them
		if _, err := os.Stat(*cert); os.IsNotExist(err) {
			log.Printf("Certificate file not found: %s\n", *cert)
			log.Println("Falling back to HTTP")
			return app.Listen(*addr)
		}
		if _, err := os.Stat(*key); os.IsNotExist(err) {
			log.Printf("Key file not found: %s\n", *key)
			log.Println("Falling back to HTTP")
			return app.Listen(*addr)
		}
		log.Printf("Using TLS with cert: %s, key: %s\n", *cert, *key)
		return app.ListenTLS(*addr, *cert, *key)
	}
	log.Println("Cert or key not found, falling back to HTTP")
	return app.Listen(*addr)
}

func dispatchKeyFrames() {
	for range time.NewTicker(time.Second * 3).C {
		for _, room := range w.Rooms {
			room.Peers.DispatchKeyFrame()
		}
	}
}
