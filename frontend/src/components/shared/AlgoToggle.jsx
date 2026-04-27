export default function AlgoToggle({ value, onChange, options }) {
  return (
    <div className="algo-toggle">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`algo-btn ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}