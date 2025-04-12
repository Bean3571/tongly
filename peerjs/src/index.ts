import { ExpressPeerServer } from "peer";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import express from "express";
import cors from "cors";

// Configure Express app
const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint
app.get("/health", (_, res) => {
    res.send("PeerJS server is running");
});

const PORT = Number(process.env.PORT) || 9001;
const HOST = process.env.HOST || '0.0.0.0';

// Configure PeerServer with HTTPS support
type SSLOptions = {
    key: Buffer;
    cert: Buffer;
} | undefined;

let ssl: SSLOptions;

try {
    // Try to load SSL certificates if they exist
    ssl = {
        key: fs.readFileSync(path.resolve("../certs/localhost+4-key.pem")),
        cert: fs.readFileSync(path.resolve("../certs/localhost+4.pem"))
    };
    // tslint:disable-next-line:no-console
    console.log("Using HTTPS for PeerJS server with certificates from certs directory");
} catch (error) {
    // tslint:disable-next-line:no-console
    console.error("Certificate files not found, using HTTP for PeerJS server", error);
    ssl = undefined;
}

// Create the server directly using ExpressPeerServer
const server = ssl
    ? https.createServer(ssl, app)
    : http.createServer(app);

interface PeerClient {
    getId(): string;
}

const peerServer = ExpressPeerServer(server, {
    path: '/',
    key: 'peerjs',
    allow_discovery: true
});

// Mount PeerJS server
app.use('/', peerServer);

// Event listeners
// tslint:disable-next-line:no-console
peerServer.on('connection', (client: PeerClient) => {
    // tslint:disable-next-line:no-console
    console.log(`Client connected: ${client.getId()}`);
});

// tslint:disable-next-line:no-console
peerServer.on('disconnect', (client: PeerClient) => {
    // tslint:disable-next-line:no-console
    console.log(`Client disconnected: ${client.getId()}`);
});

// Start the server
server.listen(PORT, HOST, () => {
    const protocol = ssl ? 'https' : 'http';
    // tslint:disable-next-line:no-console
    console.log(`PeerJS server running on ${protocol}://${HOST}:${PORT}`);
    // tslint:disable-next-line:no-console
    console.log(`Access locally via ${protocol}://localhost:${PORT}`);
    // tslint:disable-next-line:no-console
    console.log(`Access on network via ${protocol}://192.168.0.100:${PORT}`);
});
