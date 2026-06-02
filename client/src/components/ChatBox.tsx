type Props = {
  message: string;
  setMessage: (
    value: string
  ) => void;
  sendMessage: () => void;
  messages: string[];
};

function ChatBox({
  message,
  setMessage,
  sendMessage,
  messages,
}: Props) {
  return (
    <div className="card">
      <h2>Realtime Chat</h2>

      <div className="chat-box">
        {messages.map(
          (msg, index) => (
            <p key={index}>{msg}</p>
          )
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type message..."
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
        />

        <button onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatBox;
