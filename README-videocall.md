# Video Call Application Setup

This README provides instructions for setting up and running the video call application with PeerJS and Socket.IO.

## Prerequisites

- Node.js (v14 or higher)
- Yarn or npm
- SSL certificates (already provided in the `certs` directory)

## Installation

1. Clone the repository
2. Install dependencies for each component:

```bash
# PeerJS server
cd peerjs
yarn install

# Socket.IO server
cd server
yarn install

# Frontend app
cd frontend
yarn install
```

## SSL Certificates

The application uses SSL certificates located in the `certs` directory:
- `localhost+4.pem`: SSL Certificate
- `localhost+4-key.pem`: Private Key

These certificates are already configured in all components of the application:
- The Socket.IO server
- The PeerJS server
- The frontend application

## Configuration

### Frontend Environment Variables

The frontend is already configured to use HTTPS with the certificates from the `certs` directory. 
The configuration is in the `package.json` file:

```json
"scripts": {
  "start": "cross-env HTTPS=true SSL_CRT_FILE=../certs/localhost+4.pem SSL_KEY_FILE=../certs/localhost+4-key.pem react-scripts start"
}
```

## Running the Application

### 1. Start the Socket.IO Server

```bash
cd server
yarn build
yarn start
```

The server will run on port 8000 with HTTPS.

### 2. Start the PeerJS Server

```bash
cd peerjs
yarn build
yarn start
```

The PeerJS server will run on port 9001 with HTTPS.

### 3. Start the Frontend Application

```bash
cd frontend
yarn start
```

The frontend will run on HTTPS with the provided certificates.

### Alternative: Start All Servers at Once

You can use the provided script to start all servers at once:

```bash
chmod +x start-video-servers.sh
./start-video-servers.sh
```

## Using the Application

1. Navigate to `https://[YOUR_IP]:3000` in your browser
2. Accept the certificate security warning if presented
3. Navigate to the "Video Call" page using the navbar
4. Create a new room or join an existing one by ID
5. Share the room ID with others to join the call

## Features

- Video and audio calls with multiple participants
- Screen sharing
- Camera and microphone controls
- Room ID sharing
- Works across local network with HTTPS

## Troubleshooting

- **Certificate Errors**: Even with valid certificates, browsers may show warnings. You can proceed by accepting the risk.
- **Camera/Microphone Access**: Make sure to grant permission when prompted by the browser.
- **Network Issues**: Ensure all devices are on the same local network.
- **Port Conflicts**: If ports are already in use, update the port numbers in the configuration files. 