import { PeerServer } from "peer";
import fs from "fs";
import path from "path";

// Configure PeerServer with HTTPS support
let ssl;

try {
    // Try to load SSL certificates if they exist
    ssl = {
        key: fs.readFileSync(path.resolve("../certificates/key.pem")).toString(),
        cert: fs.readFileSync(path.resolve("../certificates/cert.pem")).toString()
    };
    // tslint:disable-next-line:no-console
    console.log("Using HTTPS for PeerJS server");
} catch (error) {
    // tslint:disable-next-line:no-console
    console.log("Certificate files not found, using HTTP for PeerJS server");
}

// tslint:disable-next-line:no-console
PeerServer({
    port: 9001,
    path: "/",
    proxied: true, // Enable if behind a reverse proxy
    ssl // Will be undefined if certificates don't exist
}).on("connection", () => {
    // Empty handler to use the server instance
});

// tslint:disable-next-line:no-console
console.log(`PeerJS server running on port 9001`);
// tslint:disable-next-line:no-console
console.log(`Access locally via ${ssl ? "https" : "http"}://localhost:9001`);
// tslint:disable-next-line:no-console
console.log(`Access on network via ${ssl ? "https" : "http"}://192.168.0.100:9001`);
