import { useEffect, useState } from "react";
import { socket } from "./socket/socket";
//revert

function App() {
  const [roomId, setRoomId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    socket.on("receive-message", (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user-joined", (id: string) => {
      console.log("User joined:", id);
    });

    return () => {
      socket.off("receive-message");
      socket.off("user-joined");
    };
  }, []);

  const joinRoom = () => {
    if (!roomId) return;
      console.log("Joining room:", roomId);

    socket.emit("join-room", roomId);
  };

  const sendMessage = () => {
    if (!message) return;
  console.log("Sending:", message);
    socket.emit("send-message", {
      roomId,
      message,
    });

    setMessages((prev) => [...prev, `Me: ${message}`]);

    setMessage("");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>WebRTC File Transfer</h1>

      <input
        type="text"
        placeholder="Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />

      <button onClick={joinRoom}>Join Room</button>

      <hr />

      <input
        type="text"
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage}>Send</button>

      <div>
        <h3>Messages</h3>

        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
    </div>
  );
}

export default App;