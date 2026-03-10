import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import express from "express";
import http from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);

app.use(express.static(__dirname));

server.on("upgrade", (req, socket, head) => {
    if (req.url.endsWith("/wisp/")) {
        wisp.handleRequest(req, socket, head);
    } else {
        socket.end();
    }
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server active at http://localhost:${PORT}`);
});
