export default function Toast({ msg, show, isError }) {
  return <div className={`toast ${show ? 'show' : ''}`} style={isError ? { background: 'var(--danger)' } : undefined}>{msg}</div>;
}
