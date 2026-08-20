import { fmt } from '../helper';

function displayDuration(duration) {
  if (typeof duration === 'number') return fmt(duration);
  if (typeof duration === 'string' && duration.trim()) {
    const seconds = Number(duration);
    return Number.isNaN(seconds) ? duration : fmt(seconds);
  }
  return '—';
}

export default function DetailsPanel({ song, onClose }) {
  if (!song) return null;

  const cover = song?.coverData || song?.coverUrl;

  return (
    <aside className="details-panel">
      <div className="details-header">
        <span className="details-label">Song details</span>
        {song && <button className="icon-btn" onClick={onClose} title="Close details" aria-label="Close details">×</button>}
      </div>
      <div className="details-content">
          <div className="details-cover">{cover ? <img src={cover} alt="" /> : '♫'}</div>
          <h2 className="details-title">{song.title || 'Untitled'}</h2>
          <p className="details-artist">{song.artist || 'Unknown artist'}</p>
          <dl className="details-list">
            <div><dt>Album</dt><dd>{song.album || '—'}</dd></div>
            <div><dt>Duration</dt><dd>{displayDuration(song.duration)}</dd></div>
            <div><dt>Added</dt><dd>{song.addedAt ? new Date(song.addedAt).toLocaleDateString() : '—'}</dd></div>
          </dl>
      </div>
    </aside>
  );
}
