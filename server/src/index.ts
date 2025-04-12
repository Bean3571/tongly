import express from "express";
import http from "http";
import https from "https";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import { roomHandler } from "./room";

const app = express();

app.get("/health", (_, res) => {
    res.send("Server is running");
});

app.use(cors());
const port = 8080;

let server: http.Server | https.Server;

try {
    const httpsOptions = {
        key: fs.readFileSync("../certificates/key.pem"),
        cert: fs.readFileSync("../certificates/cert.pem")
    };
    server = https.createServer(httpsOptions, app);
    console.log("Using HTTPS server");
} catch (error) {
    console.log("Certificate files not found, using HTTP server");
    server = http.createServer(app);
}

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log("a user connected");
    roomHandler(socket);
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

server.listen(port, "0.0.0.0", () => {
    const protocol = server instanceof https.Server ? "HTTPS" : "HTTP";
    console.log(`${protocol} Server running on ${protocol.toLowerCase()}://0.0.0.0:${port}`);
    console.log(`Access locally via ${protocol.toLowerCase()}://localhost:${port}`);
    console.log(`Access on network via ${protocol.toLowerCase()}://${process.env.SERVER_IP || "192.168.0.100"}:${port}`);
});
