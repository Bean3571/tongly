import express from "express";
import http from "http";
import https from "https";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import { roomHandler } from "./room";

const app = express();

app.get("/health", (_, res) => {
    res.send("Socket.IO Server is running");
});

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));

const port = Number(process.env.PORT) || 8000;

let server: http.Server | https.Server;

try {
    const httpsOptions = {
        key: fs.readFileSync("../certs/localhost+4-key.pem"),
        cert: fs.readFileSync("../certs/localhost+4.pem")
    };
    server = https.createServer(httpsOptions, app);
    console.log("Using HTTPS server with certificates from certs directory");
} catch (error) {
    console.error("Certificate files not found, using HTTP server", error);
    server = http.createServer(app);
    console.warn("WARNING: Running without HTTPS is not recommended for production!");
}

// Improved Socket.IO configuration with supported options
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    // Only use options supported by Socket.IO v4
    pingTimeout: 5000,
    pingInterval: 10000,
    transports: ['websocket', 'polling']
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    roomHandler(socket);

    socket.on("disconnect", (reason) => {
        console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on("error", (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
    });
});

io.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error);
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

server.listen(port, "0.0.0.0", () => {
    const protocol = server instanceof https.Server ? "HTTPS" : "HTTP";
    console.log(`${protocol} Server running on ${protocol.toLowerCase()}://0.0.0.0:${port}`);
    console.log(`Access locally via ${protocol.toLowerCase()}://localhost:${port}`);
    console.log(`Access on network via ${protocol.toLowerCase()}://${process.env.SERVER_IP || "192.168.0.100"}:${port}`);
});
