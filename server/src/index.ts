import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-room", (roomId: string) => {
    console.log("JOIN ROOM EVENT RECEIVED:", roomId);

    socket.join(roomId);

    console.log(`${socket.id} joined ${roomId}`);

    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("send-message", ({ roomId, message }) => {
    console.log("MESSAGE EVENT:", roomId, message);

    socket.to(roomId).emit("receive-message", message);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

const PORT   = 5000
server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});