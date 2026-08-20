export default function Sidebar({ currentView, setCurrentView, playlists, onNewPlaylist, onDeletePlaylist }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="app-name">Tunes</div>
        <nav>
          <div className={`nav-item ${currentView === 'library' ? 'active' : ''}`} onClick={() => setCurrentView('library')}>
            Library
          </div>
          <div className={`nav-item ${currentView === 'liked' ? 'active' : ''}`} onClick={() => setCurrentView('liked')}>
            <span>♡</span> Liked songs
          </div>
        </nav>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-section-label">
          <span>Playlists</span>
          <button className="icon-btn" onClick={onNewPlaylist} title="New playlist" aria-label="New playlist">+</button>
        </div>
      </div>
      <div className="playlist-list">
        {playlists.map(playlist => (
          <div className={`playlist-row ${currentView === playlist.id ? 'active' : ''}`} key={playlist.id} onClick={() => setCurrentView(playlist.id)}>
            <span className="playlist-row-name">{playlist.name}</span>
            <button className="playlist-delete" onClick={event => { event.stopPropagation(); onDeletePlaylist(playlist.id); }} title="Delete playlist" aria-label={`Delete ${playlist.name}`}>×</button>
          </div>
        ))}
      </div>
    </aside>
  );
}
