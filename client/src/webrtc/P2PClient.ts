
type DataMessage =
  | {
      type: "text";
      message: string;
    }
  | {
      type: "file-meta";
      fileName: string;
      fileSize: number;
    }
  | {
      type: "file-complete";
    };

class P2PClient {
  private peer: RTCPeerConnection;

  private dataChannel?: RTCDataChannel;

  private pendingCandidates:
    RTCIceCandidateInit[] = [];

  public onIceCandidate?: (
    candidate: RTCIceCandidate
  ) => void;

  public onMessage?: (
    message: DataMessage | ArrayBuffer
  ) => void;

  constructor() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls:
            "stun:stun.l.google.com:19302",
        },
      ],
    });

    console.log(
      "RTCPeerConnection created"
    );

    this.peer.onicecandidate = (
      event
    ) => {
      if (event.candidate) {
        console.log(
          "New ICE Candidate:",
          event.candidate
        );

        this.onIceCandidate?.(
          event.candidate
        );
      }
    };

    this.peer.onconnectionstatechange =
      () => {
        console.log(
          "Connection State:",
          this.peer.connectionState
        );

        console.log(
          "ICE Connection State:",
          this.peer.iceConnectionState
        );
      };

    this.peer.ondatachannel = (
      event
    ) => {
      console.log(
        "DataChannel received"
      );

      this.setupDataChannel(
        event.channel
      );
    };
  }

  private setupDataChannel(
    channel: RTCDataChannel
  ) {
    this.dataChannel = channel;

    channel.onopen = () => {
      console.log(
        "DataChannel opened"
      );
    };

    channel.onmessage = (event) => {
      if (typeof event.data === "string") {
        const parsed =
          JSON.parse(event.data);

        console.log(
          "Structured Message:",
          parsed
        );

        this.onMessage?.(parsed);
      } else {
        console.log(
          "Binary Chunk Received"
        );

        this.onMessage?.(event.data);
      }
    };
  }

  public createDataChannel() {
    const channel =
      this.peer.createDataChannel(
        "chat"
      );

    console.log(
      "Creating DataChannel"
    );

    this.setupDataChannel(channel);
  }

  public sendStructuredMessage(
    message: DataMessage
  ) {
    if (
      this.dataChannel?.readyState ===
      "open"
    ) {
      this.dataChannel.send(
        JSON.stringify(message)
      );
    }
  }

  public sendBinaryChunk(
    chunk: ArrayBuffer
  ) {
    if (
      this.dataChannel?.readyState ===
      "open"
    ) {
      this.dataChannel.send(chunk);

      console.log(
        "Binary Chunk Sent:",
        chunk.byteLength
      );
    }
  }

  public sendMessage(message: string) {
    if (
      this.dataChannel?.readyState ===
      "open"
    ) {
      this.dataChannel.send(message);

      console.log(
        "P2P Message Sent:",
        message
      );
    } else {
      console.log(
        "DataChannel not open"
      );
    }
  }

  public getPeer() {
    return this.peer;
  }

  public async createOffer() {
    this.createDataChannel();

    const offer =
      await this.peer.createOffer();

    await this.peer.setLocalDescription(
      offer
    );

    console.log(
      "Offer Created:",
      offer
    );

    return offer;
  }

  public async createAnswer(
    offer: RTCSessionDescriptionInit
  ) {
    if (
      this.peer.signalingState !==
      "stable"
    ) {
      console.log(
        "Skipping answer creation. Invalid signaling state:",
        this.peer.signalingState
      );

      return;
    }

    await this.peer.setRemoteDescription(
      offer
    );

    console.log(
      "Remote offer set"
    );

    const answer =
      await this.peer.createAnswer();

    await this.peer.setLocalDescription(
      answer
    );

    console.log(
      "Answer Created:",
      answer
    );

    await this.flushPendingCandidates();

    return answer;
  }

  public async handleAnswer(
    answer: RTCSessionDescriptionInit
  ) {
    console.log(
      "Handling remote answer"
    );

    await this.peer.setRemoteDescription(
      answer
    );

    console.log(
      "Remote Answer Set"
    );

    await this.flushPendingCandidates();
  }

  public async addIceCandidate(
    candidate: RTCIceCandidateInit
  ) {
    if (!this.peer.remoteDescription) {
      console.log(
        "Queueing ICE Candidate"
      );

      this.pendingCandidates.push(
        candidate
      );

      return;
    }

    try {
      await this.peer.addIceCandidate(
        candidate
      );

      console.log(
        "ICE Candidate Added"
      );
    } catch (error) {
      console.error(
        "Failed to add ICE candidate",
        error
      );
    }
  }

  private async flushPendingCandidates() {
    console.log(
      "Flushing pending ICE candidates:",
      this.pendingCandidates.length
    );

    while (
      this.pendingCandidates.length > 0
    ) {
      const candidate =
        this.pendingCandidates.shift();

      if (!candidate) continue;

      try {
        await this.peer.addIceCandidate(
          candidate
        );

        console.log(
          "Queued ICE Candidate Added"
        );
      } catch (error) {
        console.error(
          "Failed to add queued candidate",
          error
        );
      }
    }
  }
}

export const p2pClient =
  new P2PClient();
