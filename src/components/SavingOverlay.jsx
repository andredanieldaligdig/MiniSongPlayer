export default function SavingOverlay({ show, msg }) {
  return <div className={`saving-overlay ${show ? 'show' : ''}`}><span className="spinner" />{msg}</div>;
}
