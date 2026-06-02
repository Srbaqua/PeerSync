type Props = {
  text: string;
};

function Toast({ text }: Props) {
  if (!text) return null;

  return (
    <div className="toast">
      {text}
    </div>
  );
}

export default Toast;