
export class P2PClient {
  private peer: RTCPeerConnection;

  constructor() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    console.log("RTCPeerConnection created");

    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(
          "New ICE Candidate:",
          event.candidate
        );
      }
    };

    this.peer.onconnectionstatechange = () => {
      console.log(
        "Connection State:",
        this.peer.connectionState
      );
    };
  }

  public getPeer() {
    return this.peer;
  }

  public async createOffer() {
    const offer = await this.peer.createOffer();

    await this.peer.setLocalDescription(offer);

    console.log("Offer Created:", offer);

    return offer;
  }

  public async createAnswer(
    offer: RTCSessionDescriptionInit
  ) {
    if (this.peer.signalingState !== "stable") {
      console.log(
        "Skipping answer creation. Invalid signaling state:",
        this.peer.signalingState
      );

      return;
    }

    await this.peer.setRemoteDescription(offer);

    const answer = await this.peer.createAnswer();

    await this.peer.setLocalDescription(answer);

    console.log("Answer Created:", answer);

    return answer;
  }

  public async handleAnswer(
    answer: RTCSessionDescriptionInit
  ) {
    console.log("Handling remote answer");

    await this.peer.setRemoteDescription(answer);

    console.log("Remote Answer Set");
  }
}

