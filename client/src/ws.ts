import socketIOClient from "socket.io-client";
import { SOCKET_URL } from "./config";

// Use network IP from config instead of hard-coded value
export const WS = SOCKET_URL;
export const ws = socketIOClient(WS);
