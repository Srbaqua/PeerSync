import express from "express";
import {Server} from "socket.io";
import http from "http";
import cors from "cors";

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"*",        
    },
});

io.on("connection",(socket)=>{
    console.log("User Connected:",socket.id);
    socket.on("Join-room",(roomId:string)=>{
        socket.join(roomId);
        console.log(`${socket.id} joined ${roomId}`);
        socket.to(roomId).emit("user-join",socket.id);
    });
    socket.on("send-message",({roomId,message})=>{
        socket.to(roomId).emit("recieve-message",message);
    });
    socket.on("disconnect",()=>{
        console.log("Disconnected:",socket.id);
    });
});
const PORT   = 5000
server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});


