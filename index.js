import "dotenv/config";
import http from "node:http";
import express from "express";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import chalk from "chalk";

const app = express();
const server = http.createServer(app);

// Wisp handles the WebSocket upgrade routing
server.on("upgrade", (req, socket, head) => {
    if (req.url.startsWith("/wisp/")) {
        wisp.routeRequest(req, socket, head);
    } else {
        // Drop any upgrade requests that aren't meant for Wisp
        socket.destroy();
    }
});

// Basic health check route so Vercel/browsers don't throw a 404
app.get("/", (req, res) => {
    res.status(200).send("Wisp server is active and listening for WebSocket upgrades.");
});

const PORT = process.env.PORT || 8080;


