
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { socket } from "./socket/socket";

import { p2pClient } from "./webrtc/P2PClient";

function App() {
  const isOffererRef = useRef(false);

  const [roomId, setRoomId] = useState("");

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState<string[]>([]);

  const [hasCreatedOffer, setHasCreatedOffer] =
    useState(false);

  const createOffer = async () => {
    if (hasCreatedOffer) {
      console.log("Offer already created");

      return;
    }

    setHasCreatedOffer(true);

    isOffererRef.current = true;

    const offer =
      await p2pClient.createOffer();

    socket.emit("offer", {
      roomId,
      offer,
      senderId: socket.id,
    });
  };


const createAnswer = async (
  offer: RTCSessionDescriptionInit,
  targetId: string
) => {
  const answer =
    await p2pClient.createAnswer(
      offer
    );

  if (!answer) return;

  socket.emit("answer", {
    answer,
    targetId,
  });
};

  p2pClient.onIceCandidate = (
    candidate
  ) => {
    socket.emit("ice-candidate", {
      roomId,
      candidate,
      senderId: socket.id,
    });
  };

  p2pClient.onMessage = (
    message
  ) => {
    setMessages((prev) => [
      ...prev,
      `Peer: ${message}`,
    ]);
  };


useEffect(() => {
  const handleOffer = async ({
    offer,
    senderId,
  }: {
    offer: RTCSessionDescriptionInit;
    senderId: string;
  }) => {
    if (senderId === socket.id) {
      console.log(
        "Ignoring own offer"
      );

      return;
    }

    console.log(
      "Offer received in frontend"
    );

    await createAnswer(offer,senderId);
  };

  const handleAnswer = async ({
    answer,
    senderId,
  }: {
    answer: RTCSessionDescriptionInit;
    senderId: string;
  }) => {
    if (senderId === socket.id) {
      console.log(
        "Ignoring own answer"
      );

      return;
    }

    console.log(
      "RAW ANSWER EVENT RECEIVED"
    );

    console.log(
      "Answer received in frontend"
    );

    await p2pClient.handleAnswer(
      answer
    );
  };

  const handleIceCandidate =
    async ({
      candidate,
      senderId,
    }: {
      candidate: RTCIceCandidateInit;
      senderId: string;
    }) => {
      if (senderId === socket.id) {
        return;
      }

      console.log(
        "ICE Candidate received in frontend"
      );

      await p2pClient.addIceCandidate(
        candidate
      );
    };

  socket.removeAllListeners(
    "offer"
  );

  socket.removeAllListeners(
    "answer"
  );

  socket.removeAllListeners(
    "ice-candidate"
  );

  socket.on("offer", handleOffer);

  socket.on("answer", handleAnswer);

  socket.on(
    "ice-candidate",
    handleIceCandidate
  );

  socket.on(
    "user-joined",
    (id: string) => {
      console.log(
        "User joined:",
        id
      );
    }
  );

  return () => {
    socket.off(
      "offer",
      handleOffer
    );

    socket.off(
      "answer",
      handleAnswer
    );

    socket.off(
      "ice-candidate",
      handleIceCandidate
    );

    socket.off("user-joined");
  };
}, []);



  const joinRoom = () => {
    if (!roomId) return;

    socket.emit("join-room", roomId);
  };

  const sendMessage = () => {
    if (!message) return;

    p2pClient.sendMessage(message);

    setMessages((prev) => [
      ...prev,
      `Me: ${message}`,
    ]);

    setMessage("");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>WebRTC File Transfer</h1>

      <input
        type="text"
        placeholder="Room ID"
        value={roomId}
        onChange={(e) =>
          setRoomId(e.target.value)
        }
      />

      <button onClick={joinRoom}>
        Join Room
      </button>

      <hr />

      <input
        type="text"
        placeholder="Message"
        value={message}
        onChange={(e) =>
          setMessage(e.target.value)
        }
      />

      <button onClick={createOffer}>
        Create Offer
      </button>

      <button onClick={sendMessage}>
        Send
      </button>

      <div>
        <h3>Messages</h3>

        {messages.map(
          (msg, index) => (
            <p key={index}>{msg}</p>
          )
        )}
      </div>
    </div>
  );
}

export default App;