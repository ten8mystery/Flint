/**
 * Optimized Bare-Mux Worker Logic
 */
!function() {
    "use strict";

    const post = MessagePort.prototype.postMessage;
    let transport = null;
    let transportName = "";
    let streamSupport = null;

    // Helper: Centralized Error Reporting
    function reportError(port, err, context) {
        console.error(`[Bare-Mux] Error in '${context}':`, err);
        post.call(port, {
            type: "error",
            error: err instanceof Error ? err.message : String(err),
            context
        });
    }

    // Helper: Check for Transferable Stream Support
    function checkStreamSupport() {
        if (streamSupport !== null) return streamSupport;
        try {
            const { port1 } = new MessageChannel();
            const stream = new ReadableStream();
            post.call(port1, stream, [stream]);
            streamSupport = true;
        } catch (e) {
            streamSupport = false;
        }
        return streamSupport;
    }

    async function handleFetch(msg, port, client) {
        try {
            const response = await client.request(
                new URL(msg.fetch.remote),
                msg.fetch.method,
                msg.fetch.body,
                msg.fetch.headers,
                null
            );

            // If browser doesn't support transferring streams, buffer it to ArrayBuffer
            if (!checkStreamSupport() && response.body instanceof ReadableStream) {
                const resClone = new Response(response.body);
                response.body = await resClone.arrayBuffer();
            }

            const transfer = (response.body instanceof ReadableStream || response.body instanceof ArrayBuffer) 
                ? [response.body] 
                : [];

            post.call(port, { type: "fetch", fetch: response }, transfer);
        } catch (err) {
            reportError(port, err, "fetch");
        }
    }

    function setupPort(port) {
        port.onmessage = async (event) => {
            const { port: targetPort, message: msg } = event.data;

            switch (msg.type) {
                case "ping":
                    post.call(targetPort, { type: "pong" });
                    break;

                case "get":
                    post.call(targetPort, { type: "get", name: transportName });
                    break;

                case "set":
                    try {
                        if (msg.client.function === "bare-mux-remote") {
                            transport = msg.client.args[0];
                            transportName = `bare-mux-remote (${msg.client.args[1]})`;
                        } else {
                            // Use a more secure and readable way to init transport
                            const factory = new Function(`return (${msg.client.function})`)();
                            const [TransportClass, name] = await factory();
                            transport = new TransportClass(...msg.client.args);
                            transportName = name;
                        }
                        
                        console.debug("[Bare-Mux] Transport set to:", transportName);
                        post.call(targetPort, { type: "set" });
                    } catch (err) {
                        reportError(targetPort, err, "set");
                    }
                    break;

                case "fetch":
                case "websocket":
                    if (!transport) {
                        reportError(targetPort, "No BareTransport set.", msg.type);
                        return;
                    }

                    // Handle nested MessagePort transports
                    if (transport instanceof MessagePort) {
                        const transferables = [targetPort];
                        if (msg.fetch?.body) transferables.push(msg.fetch.body);
                        if (msg.websocket?.channel) transferables.push(msg.websocket.channel);
                        
                        post.call(transport, { message: msg, port: targetPort }, transferables);
                        return;
                    }

                    // Standard Transport Object logic
                    try {
                        if (!transport.ready) await transport.init();
                        
                        if (msg.type === "fetch") {
                            await handleFetch(msg, targetPort, transport);
                        } else {
                            // WebSocket Logic
                            const [send, close] = transport.connect(
                                new URL(msg.websocket.url),
                                msg.websocket.protocols,
                                msg.websocket.requestHeaders,
                                (onOpen) => post.call(msg.websocket.channel, { type: "open", args: [onOpen] }),
                                (onMsg) => {
                                    const t = onMsg instanceof ArrayBuffer ? [onMsg] : [];
                                    post.call(msg.websocket.channel, { type: "message", args: [onMsg] }, t);
                                },
                                (code, reason) => post.call(msg.websocket.channel, { type: "close", args: [code, reason] }),
                                (onErr) => post.call(msg.websocket.channel, { type: "error", args: [onErr] })
                            );

                            msg.websocket.channel.onmessage = (e) => {
                                if (e.data.type === "data") send(e.data.data);
                                else if (e.data.type === "close") close(e.data.closeCode, e.data.closeReason);
                            };

                            post.call(targetPort, { type: "websocket" });
                        }
                    } catch (err) {
                        reportError(targetPort, err, msg.type);
                    }
                    break;
            }
        };
    }

    // Initialize
    new BroadcastChannel("bare-mux").postMessage({ type: "refreshPort" });

    self.onconnect = (e) => {
        setupPort(e.ports[0]);
    };

    console.debug("Bare-Flint 1.0 running!");
}();
