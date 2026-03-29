import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import express from "express";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);

// 1. Serve your Scramjet frontend files from the root
// This will serve index.html, scramjet.config.js, etc.
app.use(express.static(__dirname));

// 2. Handle Wisp WebSocket upgrades (Critical for proxying)
server.on("upgrade", (req, socket, head) => {
    if (req.url.endsWith("/wisp/")) {
        wisp.routeRequest(req, socket, head);
    }
});

// 3. Use Koyeb's dynamic port
const port = process.env.PORT || 8000;
server.listen(port, () => {
    console.log(`Scramjet + Wisp active on port ${port}`);
});
