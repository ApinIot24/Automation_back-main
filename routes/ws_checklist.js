// ./routes/ws_checklist.js
import { Router } from "websocket-express";

const app = new Router();

app.ws("/status/mobile", async (req, res) => {
  const ws = await res.accept();
  ws.on("message", (msg) => {
    ws.send(`Mobile Status Echo: ${msg}`);
  });
  ws.send("Hello from WebSocket!");
});

export default app;
