import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { initSocket } from "./socket/index.js";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
