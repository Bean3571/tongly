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
    res.send("Server is running");
});
app.use((0, cors_1.default)());
var port = 8080;
var server;
try {
    var httpsOptions = {
        key: fs_1.default.readFileSync("../certificates/key.pem"),
        cert: fs_1.default.readFileSync("../certificates/cert.pem")
    };
    server = https_1.default.createServer(httpsOptions, app);
    console.log("Using HTTPS server");
}
catch (error) {
    console.log("Certificate files not found, using HTTP server");
    server = http_1.default.createServer(app);
}
var io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
io.on("connection", function (socket) {
    console.log("a user connected");
    (0, room_1.roomHandler)(socket);
    socket.on("disconnect", function () {
        console.log("user disconnected");
    });
});
server.listen(port, "0.0.0.0", function () {
    var protocol = server instanceof https_1.default.Server ? "HTTPS" : "HTTP";
    console.log("".concat(protocol, " Server running on ").concat(protocol.toLowerCase(), "://0.0.0.0:").concat(port));
    console.log("Access locally via ".concat(protocol.toLowerCase(), "://localhost:").concat(port));
    console.log("Access on network via ".concat(protocol.toLowerCase(), "://").concat(process.env.SERVER_IP || "192.168.0.100", ":").concat(port));
});
