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
	addr = flag.String("addr", "0.0.0.0:8081", "")
	cert = flag.String("cert", "", "Certificate file path")
	key  = flag.String("key", "", "Key file path")
)

func Run() error {
	flag.Parse()

	if *addr == ":" {
		*addr = ":8081"
	}

	// Use environment variables for cert paths if provided
	if envCert := os.Getenv("CERT_FILE"); envCert != "" {
		*cert = envCert
	} else if *cert == "" {
		*cert = "../certs/cert.pem"
	}

	if envKey := os.Getenv("KEY_FILE"); envKey != "" {
		*key = envKey
	} else if *key == "" {
		*key = "../certs/key.pem"
	}

	engine := html.New("./views", ".html")
	app := fiber.New(fiber.Config{Views: engine})
	app.Use(logger.New())

	// Use a more permissive CORS configuration for development
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "https://frontend,http://frontend,https://localhost,http://localhost,https://localhost:443,http://localhost:443,https://localhost:3000,http://localhost:3000",
		AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	// API endpoints used by LessonRoom
	app.Get("/api/room/:uuid/video", handlers.RoomVideoOnly)
	app.Get("/api/room/:uuid/video/websocket", websocket.New(handlers.RoomWebsocket, websocket.Config{
		HandshakeTimeout: 10 * time.Second,
	}))
	app.Get("/api/room/:uuid/chat", handlers.RoomChatOnly)
	app.Get("/api/room/:uuid/chat/websocket", websocket.New(handlers.RoomChatWebsocket))
	app.Get("/api/room/:uuid/exists", handlers.RoomExists)
	app.Post("/api/room/create/:uuid", handlers.RoomCreateWithID)

	// Health check endpoint for Docker
	app.Get("/api/room/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	app.Static("/", "./assets")

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
