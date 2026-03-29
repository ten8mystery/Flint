import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import express from "express";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);


 => {
    if (req.url.endsWith("/wisp/")) {
        wisp.routeRequest(req, socket, head);
    }
});


const port = process.env.PORT || 8000;
server.listen(port, () => {
    console.log(`Scramjet + Wisp running on port ${port}`);
});
