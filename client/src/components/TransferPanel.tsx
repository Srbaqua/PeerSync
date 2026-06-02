type Props = {
  sendFile: (
    file: File
  ) => void;

  sendingProgress: number;

  receivingProgress: number;

  sendingFileName: string;

  receivingFileName: string;
};

function TransferPanel({
  sendFile,
  sendingProgress,
  receivingProgress,
  sendingFileName,
  receivingFileName,
}: Props) {
  return (
    <div className="card">
      <h2>File Transfer</h2>

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

      {sendingProgress > 0 && (
        <div className="progress-section">
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
        <div className="progress-section">
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
  );
}

export default TransferPanel;
