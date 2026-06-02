
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
    console.log(
      "JOIN ROOM EVENT RECEIVED:",
      roomId
    );

    socket.join(roomId);

    console.log(
      `${socket.id} joined ${roomId}`
    );

    socket
      .to(roomId)
      .emit("user-joined", socket.id);
  });

  socket.on(
    "offer",
    ({ roomId, offer, senderId }) => {
      console.log("Offer received");

      socket.to(roomId).emit(
        "offer",
        {
          offer,
          senderId,
        }
      );
    }
  );

  socket.on(
    "answer",
    ({
      answer,
      targetId,
    }: {
      answer: RTCSessionDescriptionInit;
      targetId: string;
    }) => {
      console.log(
        "Answer received"
      );

      io.to(targetId).emit(
        "answer",
        {
          answer,
        }
      );

      console.log(
        "Answer forwarded directly"
      );
    }
  );

  socket.on(
    "ice-candidate",
    ({
      roomId,
      candidate,
      senderId,
    }) => {
      console.log(
        "ICE Candidate received"
      );

      socket.to(roomId).emit(
        "ice-candidate",
        {
          candidate,
          senderId,
        }
      );
    }
  );

  socket.on("disconnect", () => {
    console.log(
      "Disconnected:",
      socket.id
    );
  });
});

const PORT = 5000;

server.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT}`
  );
});
