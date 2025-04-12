#!/bin/bash
echo "Starting Tongly services..."

echo "Starting PeerJS server..."
cd peerjs && yarn build && yarn start &
PEERJS_PID=$!

echo "Starting Socket.IO server..."
cd ../server && yarn build && yarn start &
SERVER_PID=$!

echo "Starting React frontend..."
cd ../frontend && yarn start &
FRONTEND_PID=$!

echo "All services started."
echo "PeerJS server: https://192.168.0.100:9001"
echo "Socket.IO server: https://192.168.0.100:8000"
echo "Frontend: https://192.168.0.100:3000"

echo "Press Ctrl+C to stop all services"
wait $PEERJS_PID $SERVER_PID $FRONTEND_PID 