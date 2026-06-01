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
  }
  public getPeer(){
    return this.peer;
  }
}