
type Props = {
  roomId: string;
  setRoomId: (
    value: string
  ) => void;
  joinRoom: () => void;
  joinedRoom: boolean;
  createOffer: () => void;
  hasCreatedOffer: boolean;
};

function RoomControls({
  roomId,
  setRoomId,
  joinRoom,
  joinedRoom,
  createOffer,
  hasCreatedOffer,
}: Props) {
  return (
    <div className="card">
      <h2>Room Connection</h2>

      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) =>
          setRoomId(e.target.value)
        }
      />

      <div className="button-group">
        <button onClick={joinRoom}>
          {joinedRoom
            ? "Room Joined"
            : "Join Room"}
        </button>

        <button onClick={createOffer}>
          {hasCreatedOffer
            ? "Offer Created"
            : "Create Offer"}
        </button>
      </div>
    </div>
  );
}

export default RoomControls;
