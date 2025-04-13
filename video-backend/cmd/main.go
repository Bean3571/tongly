package main

import (
	"flag"
	"log"
	"os"
	"path/filepath"

	"video-service/internal/server"
)

func main() {
	// Get the current working directory
	workDir, err := os.Getwd()
	if err != nil {
		log.Fatalf("Failed to get current directory: %v", err)
	}

	// Set certificate and key file paths using absolute paths
	certsDir := filepath.Join(workDir, "..", "certs")
	certFile := filepath.Join(certsDir, "cert.pem")
	keyFile := filepath.Join(certsDir, "key.pem")

	// Set as command line arguments
	flag.Set("cert", certFile)
	flag.Set("key", keyFile)

	// Also set environment variables as a fallback
	os.Setenv("CERT_FILE", certFile)
	os.Setenv("KEY_FILE", keyFile)

	log.Printf("Using certificates from: %s and %s\n", certFile, keyFile)

	if err := server.Run(); err != nil {
		log.Fatalln(err.Error())
	}
}
