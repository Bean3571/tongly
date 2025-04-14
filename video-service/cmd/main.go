package main

import (
	"log"
	"os"

	"video-service/internal/server"
)

func main() {
	// Check if certificates exist and set them as environment variables
	certFile := "../certs/cert.pem"
	keyFile := "../certs/key.pem"

	if _, err := os.Stat(certFile); err == nil {
		if _, err := os.Stat(keyFile); err == nil {
			// Both certificate files exist, set them as environment variables
			os.Setenv("CERT_FILE", certFile)
			os.Setenv("KEY_FILE", keyFile)
		}
	}

	if err := server.Run(); err != nil {
		log.Fatalln(err.Error())
	}
}
