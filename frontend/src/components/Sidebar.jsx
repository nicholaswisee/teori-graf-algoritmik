import { useGraphStore } from '../store/graphStore';

const NAV_ITEMS = [
  { section: 'Graph', items: [{ mode: 'setup', label: 'Graph Setup', icon: 'setup' }] },
  { section: 'Tugas 1', items: [
    { mode: 'traversal', label: 'Traversal', icon: 'traversal' },
    { mode: 'path', label: 'Path Finding', icon: 'path' },
    { mode: 'connected', label: 'Connectivity', icon: 'connected' },
  ]},
  { section: 'Tugas 2', items: [
    { mode: 'components', label: 'Components', icon: 'components' },
    { mode: 'islands', label: 'Island Count', icon: 'islands' },
  ]},
  { section: 'Tugas 3', items: [
    { mode: 'properties', label: 'Graph Properties', icon: 'properties' },
    { mode: 'shortest', label: 'Shortest Distance', icon: 'shortest' },
  ]},
  { section: 'Tugas 4', items: [{ mode: 'tugas4', label: 'Weighted Algorithms', icon: 'tugas4' }] },
  { section: 'Tugas 5', items: [{ mode: 'tugas5', label: 'TSP Algorithm', icon: 'tugas5' }] },
  { section: 'Tugas 6', items: [
    { mode: 'tugas6_matching', label: 'Maximum Matching', icon: 'tugas6_matching' },
    { mode: 'tugas6_timetable', label: 'Timetabling', icon: 'tugas6_timetable' },
  ]},
  { section: 'Algorithms', items: [{ mode: 'algorithms', label: 'Algorithm Viewer', icon: 'algorithms' }] },
];

function NavIcon({ icon }) {
  switch (icon) {
    case 'setup':
      return (
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="4" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="16" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 4h8M5 5.5l4 9M15 5.5l-4 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'traversal':
      return (
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'path':
      return (
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M3 17l4-4m0 0l6-6m-6 6l2-2M13 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'connected':
      return (
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'components':
      return (
        <svg viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'islands':
      return (
        <svg viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <rect x="6" y="6" width="3" height="3" fill="currentColor" rx="0.5" />
          <rect x="11" y="6" width="3" height="3" fill="currentColor" rx="0.5" />
          <rect x="6" y="11" width="3" height="3" fill="currentColor" rx="0.5" />
        </svg>
      );
    case 'properties':
      return (
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
        </svg>
      );
    case 'shortest':
      return (
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M4 16L16 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="4" cy="16" r="2" fill="currentColor" />
          <circle cx="16" cy="4" r="2" fill="currentColor" />
        </svg>
      );
    case 'tugas4':
      return (
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M4 14l4-8 4 5 4-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="4" cy="14" r="1.6" fill="currentColor" />
          <circle cx="8" cy="6" r="1.6" fill="currentColor" />
          <circle cx="12" cy="11" r="1.6" fill="currentColor" />
          <circle cx="16" cy="8" r="1.6" fill="currentColor" />
        </svg>
      );
    case 'tugas5':
      return (
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
        </svg>
      );
    case 'tugas6_matching':
      return (
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 6h2M6 9v2M14 9v2M11 14h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'tugas6_timetable':
      return (
        <svg viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 7h14M7 3v14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'algorithms':
      return (
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h10M3 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar() {
  const mode = useGraphStore((s) => s.mode);
  const setMode = useGraphStore((s) => s.setMode);

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="6" cy="6" r="4" fill="url(#sb-grad1)" />
            <circle cx="22" cy="6" r="4" fill="url(#sb-grad1)" />
            <circle cx="14" cy="22" r="4" fill="url(#sb-grad1)" />
            <line x1="6" y1="6" x2="22" y2="6" stroke="#7c6af7" strokeWidth="2" />
            <line x1="6" y1="6" x2="14" y2="22" stroke="#7c6af7" strokeWidth="2" />
            <line x1="22" y1="6" x2="14" y2="22" stroke="#7c6af7" strokeWidth="2" />
            <defs>
              <linearGradient id="sb-grad1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>
          <span className="logo-text"><em>Teori Graf</em> Algoritmik</span>
        </div>
      </div>
      {NAV_ITEMS.map((section) => (
        <div key={section.section}>
          <div className="nav-section-label">{section.section}</div>
          {section.items.map((item) => (
            <button
              key={item.mode}
              className={`nav-btn ${mode === item.mode ? 'active' : ''}`}
              onClick={() => setMode(item.mode)}
            >
              <NavIcon icon={item.icon} />
              {item.label}
            </button>
          ))}
        </div>
      ))}
      <div className="sidebar-footer">
        <span className="version-tag">Teori Graf Algoritmik v1.0</span>
      </div>
    </nav>
  );
}