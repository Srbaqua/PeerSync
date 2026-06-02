import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./App.css";

import { socket } from "./socket/socket";

import { p2pClient } from "./webrtc/P2PClient";

import StatusBar from "./components/StatusBar";

import RoomControls from "./components/RoomControls";

import ChatBox from "./components/ChatBox";

import TransferPanel from "./components/TransferPanel";

import Toast from "./components/Toast";

function App() {
  const receivedChunks = useRef<
    ArrayBuffer[]
  >([]);

  const receivedBytes = useRef(0);

  const expectedFileSize = useRef(0);

  const transferStartTime =
    useRef(0);

  const [roomId, setRoomId] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState<string[]>([]);

  const [status, setStatus] =
    useState("Disconnected");

  const [toast, setToast] =
    useState("");

  const [joinedRoom, setJoinedRoom] =
    useState(false);

  const [hasCreatedOffer, setHasCreatedOffer] =
    useState(false);

  const [sendingProgress, setSendingProgress] =
    useState(0);

  const [receivingProgress, setReceivingProgress] =
    useState(0);

  const [sendingFileName, setSendingFileName] =
    useState("");

  const [receivingFileName, setReceivingFileName] =
    useState("");

  const [transferSpeed, setTransferSpeed] =
    useState("");

  const [transferHistory, setTransferHistory] =
    useState<string[]>([]);

  const showToast = (
    text: string
  ) => {
    setToast(text);

    setTimeout(() => {
      setToast("");
    }, 2500);
  };

  const createOffer = async () => {
    if (hasCreatedOffer) return;

    setHasCreatedOffer(true);

    setStatus(
      "Creating offer..."
    );

    const offer =
      await p2pClient.createOffer();

    socket.emit("offer", {
      roomId,
      offer,
      senderId: socket.id,
    });

    showToast(
      "Offer created successfully"
    );

    setStatus("Offer sent");
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

    showToast(
      "Peer connection accepted"
    );

    setStatus("Answer sent");
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
      receivedChunks.current = [];

      receivedBytes.current = 0;

      expectedFileSize.current =
        data.fileSize;

      setReceivingFileName(
        data.fileName
      );

      transferStartTime.current =
        Date.now();

      setStatus(
        `Receiving ${data.fileName}`
      );

      showToast(
        `Receiving ${data.fileName}`
      );
    }

    if (
      data.type === "file-complete"
    ) {
      const blob = new Blob(
        receivedChunks.current
      );

      const url =
        URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href = url;

      a.download =
        receivingFileName;

      a.click();

      setTransferHistory(
        (prev) => [
          `Received: ${receivingFileName}`,
          ...prev,
        ]
      );

      setStatus(
        "File received successfully"
      );

      showToast(
        "File transfer completed"
      );
    }
  };

  useEffect(() => {
    const peer =
      p2pClient.getPeer();

    peer.onconnectionstatechange =
      () => {
        setStatus(
          `Peer: ${peer.connectionState}`
        );

        if (
          peer.connectionState ===
          "connected"
        ) {
          showToast(
            "P2P Connection Established"
          );
        }
      };

    socket.on(
      "user-joined",
      () => {
        setStatus(
          "Peer joined room"
        );

        showToast(
          "Peer joined room"
        );
      }
    );

    socket.on(
      "offer",
      async ({
        offer,
        senderId,
      }) => {
        if (
          senderId === socket.id
        )
          return;

        showToast(
          "Incoming connection request"
        );

        await createAnswer(
          offer,
          senderId
        );
      }
    );

    socket.on(
      "answer",
      async ({ answer }) => {
        await p2pClient.handleAnswer(
          answer
        );
      }
    );

    socket.on(
      "ice-candidate",
      async ({
        candidate,
        senderId,
      }) => {
        if (
          senderId === socket.id
        )
          return;

        await p2pClient.addIceCandidate(
          candidate
        );
      }
    );

    return () => {
      socket.removeAllListeners();
    };
  }, []);

  const joinRoom = () => {
    socket.emit("join-room", roomId);

    setJoinedRoom(true);

    setStatus(
      `Joined room ${roomId}`
    );

    showToast(
      `Joined room ${roomId}`
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
    setSendingFileName(file.name);

    transferStartTime.current =
      Date.now();

    const chunkSize = 16 * 1024;

    const buffer =
      await file.arrayBuffer();

    p2pClient.sendStructuredMessage({
      type: "file-meta",
      fileName: file.name,
      fileSize: file.size,
    });

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

      const elapsedSeconds =
        (Date.now() -
          transferStartTime.current) /
        1000;

      const speedMbps =
        (
          offset /
          1024 /
          1024 /
          elapsedSeconds
        ).toFixed(2);

      setTransferSpeed(
        `${speedMbps} MB/s`
      );
    }

    p2pClient.sendStructuredMessage({
      type: "file-complete",
    });

    setTransferHistory(
      (prev) => [
        `Sent: ${file.name}`,
        ...prev,
      ]
    );

    showToast(
      "File sent successfully"
    );

    setStatus(
      "File sent successfully"
    );
  };

  return (
    <div className="app-container">
      <Toast text={toast} />

      <h1 className="title">
        WebRTC File Transfer
      </h1>

      <StatusBar status={status} />

      <RoomControls
        roomId={roomId}
        setRoomId={setRoomId}
        joinRoom={joinRoom}
        joinedRoom={joinedRoom}
        createOffer={createOffer}
        hasCreatedOffer={
          hasCreatedOffer
        }
      />

      <TransferPanel
        sendFile={sendFile}
        sendingProgress={
          sendingProgress
        }
        receivingProgress={
          receivingProgress
        }
        sendingFileName={
          sendingFileName
        }
        receivingFileName={
          receivingFileName
        }
      />

      <div className="card">
        <h2>Transfer Metrics</h2>

        <p>
          Speed:
          {" "}
          {transferSpeed || "0 MB/s"}
        </p>
      </div>

      <div className="card">
        <h2>Transfer History</h2>

        {transferHistory.length ===
        0 ? (
          <p>
            No transfers yet
          </p>
        ) : (
          transferHistory.map(
            (item, index) => (
              <p key={index}>
                {item}
              </p>
            )
          )
        )}
      </div>

      <ChatBox
        message={message}
        setMessage={setMessage}
        sendMessage={sendMessage}
        messages={messages}
      />
    </div>
  );
}

export default App;
