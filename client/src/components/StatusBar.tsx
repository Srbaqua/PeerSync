
type Props = {
  status: string;
};

function StatusBar({
  status,
}: Props) {
  return (
    <div className="status-bar">
      <span className="status-dot" />

      <p>{status}</p>
    </div>
  );
}

export default StatusBar;
