
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { socket } from "./socket/socket";

import { p2pClient } from "./webrtc/P2PClient";

function App() {
  const isOffererRef = useRef(false);

  const receivedChunks = useRef<
    ArrayBuffer[]
  >([]);

  const [roomId, setRoomId] =
    useState("");

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
    data
  ) => {
    if (data instanceof ArrayBuffer) {
      console.log(
        "Received binary chunk:",
        data.byteLength
      );

      receivedChunks.current.push(
        data
      );

      return;
    }

    if (data.type === "text") {
      setMessages((prev) => [
        ...prev,
        `Peer: ${data.message}`,
      ]);
    }

    if (data.type === "file-meta") {
      console.log(
        "Receiving file:",
        data.fileName
      );

      receivedChunks.current = [];
    }

    if (
      data.type === "file-complete"
    ) {
      console.log(
        "File transfer complete"
      );

      const blob = new Blob(
        receivedChunks.current
      );

      const url =
        URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href = url;

      a.download = "received-file";

      a.click();
    }
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

      await createAnswer(
        offer,
        senderId
      );
    };

    const handleAnswer = async ({
      answer,
    }: {
      answer: RTCSessionDescriptionInit;
    }) => {
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

    p2pClient.sendStructuredMessage({
      type: "text",
      message,
    });

    setMessages((prev) => [
      ...prev,
      `Me: ${message}`,
    ]);

    setMessage("");
  };

  const sendFile = async (
    file: File
  ) => {
    const chunkSize = 16 * 1024;

    p2pClient.sendStructuredMessage({
      type: "file-meta",
      fileName: file.name,
      fileSize: file.size,
    });

    const buffer =
      await file.arrayBuffer();

    let offset = 0;

    while (offset < buffer.byteLength) {
      const chunk = buffer.slice(
        offset,
        offset + chunkSize
      );

      p2pClient.sendBinaryChunk(chunk);

      offset += chunkSize;
    }

    p2pClient.sendStructuredMessage({
      type: "file-complete",
    });

    console.log(
      "File transfer completed"
    );
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

      <br />
      <br />

      <input
        type="file"
        onChange={(e) => {
          const file =
            e.target.files?.[0];

          if (file) {
            sendFile(file);
          }
        }}
      />

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
