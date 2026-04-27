export default function PresetGrid({ presets }) {
  return (
    <div className="preset-grid">
      {presets.map((p) => (
        <button key={p.label} className="btn-preset" onClick={p.onClick}>
          {p.label}
        </button>
      ))}
    </div>
  );
}