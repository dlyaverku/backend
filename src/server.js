const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const PORT = process.env.PORT || 3000;

// HTTP сервер
const server = http.createServer(app);

// WebSocket сервер
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("challenge", (data) => {
    console.log("Challenge event:", data);
    io.emit("challenge", data); // рассылаем всем
  });

  socket.on("ready", (data) => {
    console.log("Ready:", data);
    io.emit("ready", data);
  });

  socket.on("telemetry", (data) => {
    console.log("Telemetry:", data);
    io.emit("telemetry", data);
  });

  socket.on("finish", (data) => {
    console.log("Finish:", data);
    io.emit("finish", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
