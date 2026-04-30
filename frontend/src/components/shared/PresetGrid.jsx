export default function PresetGrid({ presets, fullWidth }) {
  return (
    <div className={`preset-grid${fullWidth ? ' preset-grid--full' : ''}`}>
      {presets.map((p) => (
        <button key={p.label} className="btn-preset" onClick={p.onClick}>
          {p.label}
        </button>
      ))}
    </div>
  );
}