
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

const rooms: Record<
  string,
  string[]
> = {};

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-room", (roomId: string) => {
    console.log(
      "JOIN ROOM EVENT RECEIVED:",
      roomId
    );

    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    if (
      !rooms[roomId].includes(socket.id)
    ) {
      rooms[roomId].push(socket.id);
    }

    console.log(
      `${socket.id} joined ${roomId}`
    );

    socket
      .to(roomId)
      .emit("user-joined", socket.id);
  });

socket.on( "offer", ({ roomId, offer, senderId, }) => { console.log("Offer received"); socket.to(roomId).emit( "offer", { offer, senderId, } ); } );


socket.on(
  "answer",
  ({
    answer,
    targetId,
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

      const targetPeer =
        rooms[roomId]?.find(
          (id) => id !== senderId
        );

      if (!targetPeer) {
        console.log(
          "No target peer found for ICE"
        );

        return;
      }

      io.to(targetPeer).emit(
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

    for (const roomId in rooms) {
      rooms[roomId] = rooms[
        roomId
      ].filter(
        (id) => id !== socket.id
      );
    }
  });
});

const PORT = 5000;

server.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT}`
  );
});
