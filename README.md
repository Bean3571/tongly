# Tongly Video Call Application

This repository contains a complete video calling solution with Socket.IO and PeerJS for WebRTC connections.

## Project Structure

- **frontend/**: React application
- **server/**: Socket.IO signaling server
- **peerjs/**: PeerJS server for WebRTC connections

## Prerequisites

- Node.js 14+
- Yarn or npm
- SSL certificates (for HTTPS)

## SSL Certificates

The application requires HTTPS to work properly. SSL certificates should be placed in the `certs/` directory:

- `certs/localhost+4.pem`: Certificate file
- `certs/localhost+4-key.pem`: Private key file

You can generate self-signed certificates using [mkcert](https://github.com/FiloSottile/mkcert).

## Getting Started

### Windows

Run the start script to launch all services:

```bash
start-services.bat
```

### Linux/Mac

Run the start script to launch all services:

```bash
chmod +x start-services.sh
./start-services.sh
```

## Checking Service Health

You can check if all services are running correctly using:

```bash
node check-services.js
```

## Manual Setup

If you prefer to start services individually:

1. **Start PeerJS server**:
   ```bash
   cd peerjs
   yarn install
   yarn build
   yarn start
   ```

2. **Start Socket.IO server**:
   ```bash
   cd server
   yarn install
   yarn build
   yarn start
   ```

3. **Start React frontend**:
   ```bash
   cd frontend
   yarn install
   yarn start
   ```

## Accessing the Application

Once all services are running, you can access the application at:

- https://192.168.0.100:3000 (or your local IP address)

## Troubleshooting

If you encounter connection issues:

1. Check if all services are running using `node check-services.js`
2. Verify that your firewall allows connections on ports 3000, 8000, and 9001
3. Make sure SSL certificates are properly installed
4. Check browser console for specific error messages

## Browser Compatibility

The application works best with:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+ 