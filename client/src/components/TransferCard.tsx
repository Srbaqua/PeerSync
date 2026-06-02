type Props = {
  fileName: string;

  progress: number;

  speed?: string;

  status: string;

  type: "sending" | "receiving";

  onCancel?: () => void;
};

function TransferCard({
  fileName,
  progress,
  speed,
  status,
  type,
  onCancel,
}: Props) {
  return (
    <div className="transfer-card">
      <div className="transfer-header">
        <div>
          <h4>{fileName}</h4>

          <p>
            {type === "sending"
              ? "Sending"
              : "Receiving"}
          </p>
        </div>

        {status === "active" && (
          <button
            className="cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>

      <progress
        value={progress}
        max="100"
      />

      <div className="transfer-footer">
        <span>
          {progress.toFixed(1)}%
        </span>

        <span>{speed}</span>
      </div>
    </div>
  );
}

export default TransferCard;