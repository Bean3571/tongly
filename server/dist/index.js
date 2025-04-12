"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var https_1 = __importDefault(require("https"));
var socket_io_1 = require("socket.io");
var cors_1 = __importDefault(require("cors"));
var fs_1 = __importDefault(require("fs"));
var room_1 = require("./room");
var app = (0, express_1.default)();
app.get("/health", function (_, res) {
    res.send("Socket.IO Server is running");
});
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST']
}));
var port = Number(process.env.PORT) || 8000;
var server;
try {
    var httpsOptions = {
        key: fs_1.default.readFileSync("../certs/localhost+4-key.pem"),
        cert: fs_1.default.readFileSync("../certs/localhost+4.pem")
    };
    server = https_1.default.createServer(httpsOptions, app);
    console.log("Using HTTPS server with certificates from certs directory");
}
catch (error) {
    console.error("Certificate files not found, using HTTP server", error);
    server = http_1.default.createServer(app);
    console.warn("WARNING: Running without HTTPS is not recommended for production!");
}
// Improved Socket.IO configuration with supported options
var io = new socket_io_1.Server(server, {
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
io.on("connection", function (socket) {
    console.log("User connected: ".concat(socket.id));
    (0, room_1.roomHandler)(socket);
    socket.on("disconnect", function (reason) {
        console.log("User disconnected: ".concat(socket.id, ", reason: ").concat(reason));
    });
    socket.on("error", function (error) {
        console.error("Socket error for ".concat(socket.id, ":"), error);
    });
});
io.on("connect_error", function (error) {
    console.error("Socket.IO connection error:", error);
});
// Catch unhandled promise rejections
process.on('unhandledRejection', function (reason, promise) {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
server.listen(port, "0.0.0.0", function () {
    var protocol = server instanceof https_1.default.Server ? "HTTPS" : "HTTP";
    console.log("".concat(protocol, " Server running on ").concat(protocol.toLowerCase(), "://0.0.0.0:").concat(port));
    console.log("Access locally via ".concat(protocol.toLowerCase(), "://localhost:").concat(port));
    console.log("Access on network via ".concat(protocol.toLowerCase(), "://").concat(process.env.SERVER_IP || "192.168.0.100", ":").concat(port));
});
