// Network configuration
export const SERVER_IP = process.env.REACT_APP_SERVER_IP || "192.168.0.100";
export const SOCKET_SERVER_PORT = Number(process.env.REACT_APP_SOCKET_PORT) || 8080;
export const PEER_SERVER_PORT = Number(process.env.REACT_APP_PEER_PORT) || 9001;

// Socket server URL - Use HTTPS
export const SOCKET_URL = `https://${SERVER_IP}:${SOCKET_SERVER_PORT}`;

// Peer server settings with secure flag for HTTPS
export const PEER_CONFIG = {
  host: SERVER_IP,
  port: PEER_SERVER_PORT,
  path: "/",
  secure: true // Enable HTTPS connection
};

// For development testing
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

// Function to check if we're using a production build
export const isProd = () => process.env.NODE_ENV === "production";

console.log(`Using server: ${SERVER_IP}`);
console.log(`Socket port: ${SOCKET_SERVER_PORT}`);
console.log(`Peer port: ${PEER_SERVER_PORT}`); 