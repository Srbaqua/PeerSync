
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

  const receivedBytes = useRef(0);

  const expectedFileSize = useRef(0);

  const [roomId, setRoomId] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState<string[]>([]);

  const [hasCreatedOffer, setHasCreatedOffer] =
    useState(false);

  const [sendingProgress, setSendingProgress] =
    useState(0);

  const [receivingProgress, setReceivingProgress] =
    useState(0);

  const [receivingFileName, setReceivingFileName] =
    useState("");

  const [sendingFileName, setSendingFileName] =
    useState("");

  const [status, setStatus] =
    useState("Disconnected");

  const [joinedRoom, setJoinedRoom] =
    useState(false);

  const createOffer = async () => {
    if (hasCreatedOffer) {
      setStatus(
        "Offer already created"
      );

      return;
    }

    setStatus(
      "Creating WebRTC offer..."
    );

    setHasCreatedOffer(true);

    isOffererRef.current = true;

    const offer =
      await p2pClient.createOffer();

    socket.emit("offer", {
      roomId,
      offer,
      senderId: socket.id,
    });

    setStatus(
      "Offer created and sent"
    );
  };

  const createAnswer = async (
    offer: RTCSessionDescriptionInit,
    targetId: string
  ) => {
    setStatus(
      "Received offer. Creating answer..."
    );

    const answer =
      await p2pClient.createAnswer(
        offer
      );

    if (!answer) return;

    socket.emit("answer", {
      answer,
      targetId,
    });

    setStatus(
      "Answer sent successfully"
    );
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

      receivedBytes.current +=
        data.byteLength;

      const progress =
        (receivedBytes.current /
          expectedFileSize.current) *
        100;

      setReceivingProgress(
        Math.min(progress, 100)
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

      setStatus(
        `Receiving file: ${data.fileName}`
      );

      receivedChunks.current = [];

      receivedBytes.current = 0;

      expectedFileSize.current =
        data.fileSize;

      setReceivingProgress(0);

      setReceivingFileName(
        data.fileName
      );
    }

    if (
      data.type === "file-complete"
    ) {
      console.log(
        "File transfer complete"
      );

      setStatus(
        "File transfer completed"
      );

      const blob = new Blob(
        receivedChunks.current
      );

      const url =
        URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href = url;

      a.download =
        receivingFileName ||
        "received-file";

      a.click();

      setTimeout(() => {
        setReceivingProgress(0);
      }, 2000);
    }
  };

  useEffect(() => {
    const peer =
      p2pClient.getPeer();

    peer.onconnectionstatechange =
      () => {
        const state =
          peer.connectionState;

        console.log(
          "Connection State:",
          state
        );

        setStatus(
          `Peer Connection: ${state}`
        );
      };

    const handleOffer = async ({
      offer,
      senderId,
    }: {
      offer: RTCSessionDescriptionInit;
      senderId: string;
    }) => {
      if (senderId === socket.id) {
        return;
      }

      console.log(
        "Offer received in frontend"
      );

      setStatus(
        "Incoming connection request..."
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

      setStatus(
        "Answer received. Establishing connection..."
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

        setStatus(
          `Peer joined room`
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

    setJoinedRoom(true);

    setStatus(
      `Joined room: ${roomId}`
    );
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

    setSendingFileName(file.name);

    setSendingProgress(0);

    setStatus(
      `Sending file: ${file.name}`
    );

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

      await p2pClient.waitForBufferLow();

      p2pClient.sendBinaryChunk(chunk);

      offset += chunkSize;

      const progress =
        (offset / buffer.byteLength) *
        100;

      setSendingProgress(
        Math.min(progress, 100)
      );
    }

    p2pClient.sendStructuredMessage({
      type: "file-complete",
    });

    setStatus(
      "File sent successfully"
    );

    setTimeout(() => {
      setSendingProgress(0);
    }, 2000);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>WebRTC File Transfer</h1>

      <h3>Status: {status}</h3>

      <input
        type="text"
        placeholder="Room ID"
        value={roomId}
        onChange={(e) =>
          setRoomId(e.target.value)
        }
      />

      <button onClick={joinRoom}>
        {joinedRoom
          ? "Room Joined"
          : "Join Room"}
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
        {hasCreatedOffer
          ? "Offer Created"
          : "Create Offer"}
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

      <div style={{ marginTop: "20px" }}>
        <h3>Transfer Status</h3>

        {sendingProgress > 0 && (
          <div>
            <p>
              Sending:
              {" "}
              {sendingFileName}
            </p>

            <progress
              value={sendingProgress}
              max="100"
            />

            <p>
              {sendingProgress.toFixed(
                1
              )}
              %
            </p>
          </div>
        )}

        {receivingProgress > 0 && (
          <div>
            <p>
              Receiving:
              {" "}
              {receivingFileName}
            </p>

            <progress
              value={receivingProgress}
              max="100"
            />

            <p>
              {receivingProgress.toFixed(
                1
              )}
              %
            </p>
          </div>
        )}
      </div>

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

