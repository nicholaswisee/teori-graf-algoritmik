export default function ResultBox({ label, children, meta }) {
  return (
    <div className="result-box">
      {label && <div className="result-label">{label}</div>}
      {children}
      {meta && <div className="result-meta">{meta}</div>}
    </div>
  );
}