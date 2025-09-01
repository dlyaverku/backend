const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// подключаем гонки
require("./sockets/raceSocket")(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
