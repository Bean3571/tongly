@echo off
echo Starting Tongly services...

echo Starting PeerJS server...
start cmd /k "cd peerjs && yarn build && yarn start"

echo Starting Socket.IO server...
start cmd /k "cd server && yarn build && yarn start"

echo Starting React frontend...
start cmd /k "cd frontend && yarn start"

echo All services started.
echo PeerJS server: https://192.168.0.100:9001
echo Socket.IO server: https://192.168.0.100:8000
echo Frontend: https://192.168.0.100:3000

echo Press any key to exit...
pause > nul 