import TransferCard from "./TransferCard";

type Props = {
  sendFile: (
    file: File
  ) => void;

  sendingProgress: number;

  receivingProgress: number;

  sendingFileName: string;

  receivingFileName: string;

  transferSpeed: string;

  cancelTransfer: () => void;
};

function TransferPanel({
  sendFile,
  sendingProgress,
  receivingProgress,
  sendingFileName,
  receivingFileName,
  transferSpeed,
  cancelTransfer,
}: Props) {
  return (
    <div className="card">
      <h2>File Transfer</h2>

      <div
        className="drop-zone"
        onDragOver={(e) =>
          e.preventDefault()
        }
        onDrop={(e) => {
          e.preventDefault();

          const file =
            e.dataTransfer.files?.[0];

          if (file) {
            sendFile(file);
          }
        }}
      >
        <p>
          Drag & Drop files here
        </p>

        <span>
          or choose manually
        </span>

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
      </div>

      {sendingProgress > 0 && (
        <TransferCard
          fileName={sendingFileName}
          progress={sendingProgress}
          speed={transferSpeed}
          status="active"
          type="sending"
          onCancel={cancelTransfer}
        />
      )}

      {receivingProgress > 0 && (
        <TransferCard
          fileName={receivingFileName}
          progress={receivingProgress}
          speed={transferSpeed}
          status="active"
          type="receiving"
        />
      )}
    </div>
  );
}

export default TransferPanel;
