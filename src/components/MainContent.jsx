import { EMOJIS, fmt } from '../helper';

function formatSongDuration(duration) {
  if (typeof duration === 'number') return fmt(duration);
  if (typeof duration === 'string' && duration.trim()) {
    const seconds = Number(duration);
    return Number.isNaN(seconds) ? duration : fmt(seconds);
  }
  return '—';
}


function SongRow({ song, index, active, isPlaying, liked, isPlaylistView, onSelect, onPlay, onLike, onRemoveFromPlaylist, onAddToPlaylist }) {
  const cover = song.coverData || song.coverUrl;
  return (
    <div className={`song-row ${active ? 'playing' : ''}`} onClick={() => onSelect(song)} onDoubleClick={() => onPlay(song.id)}>
      <div className="song-num">{active && isPlaying ? <div className="wave-icon"><span /><span /><span /></div> : index + 1}</div>
      <div className="song-info">
        <div className="song-cover">{cover ? <img src={cover} alt="" /> : EMOJIS[index % EMOJIS.length]}</div>
        <div style={{ minWidth: 0 }}><div className="song-title">{song.title || 'Untitled'}</div><div className="song-sub">{song.artist || 'Unknown artist'}</div></div>
      </div>
      <div className="col-text">{song.album || '—'}</div>
      <div className="col-text">{song.addedAt ? new Date(song.addedAt).toLocaleDateString() : '—'}</div>
      <span className="col-mono">{fmt(song.duration)}</span>
      <div className="row-actions">
        <button className="icon-btn" onClick={event => { event.stopPropagation(); onLike(song.id); }} title={liked ? 'Unlike' : 'Like'} aria-label={liked ? 'Unlike song' : 'Like song'}>{liked ? '♥' : '♡'}</button>
        <button className="icon-btn" onClick={event => { event.stopPropagation(); onAddToPlaylist(song.id); }} title="Add to playlist" aria-label="Add to playlist">＋</button>
        {isPlaylistView && <button className="icon-btn" onClick={event => { event.stopPropagation(); onRemoveFromPlaylist(song.id); }} title="Remove from playlist" aria-label="Remove song from playlist">×</button>}
      </div>
    </div>
  );
}

export default function MainContent({ displayList, currentView, currentFilter, setCurrentFilter, searchQuery, setSearchQuery, playlists, likedIds, currentSongId, isPlaying, onSelect, onPlay, onLike, onRemoveFromPlaylist, onAddToPlaylist }) {
  const title = currentView === 'library' ? 'Library' : currentView === 'liked' ? 'Liked songs' : playlists.find(p => p.id === currentView)?.name || 'Playlist';
  return (
    <main className="main">
      <header className="main-header">
        <div className="header-row">
          <div className="page-title">{title}</div>
          <div className="header-actions">
            <label className="search-wrap"><span>⌕</span><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search songs..." aria-label="Search songs" /></label>
          </div>
        </div>
        <div className="filter-row">
          {[['all', 'All songs'], ['az', 'A–Z']].map(([value, label]) => <button key={value} className={`tab ${currentFilter === value ? 'active' : ''}`} onClick={() => setCurrentFilter(value)}>{label}</button>)}
        </div>
      </header>
      <section className="song-list-wrap">
        <div className="col-header"><span>#</span><span>Title</span><span>Album</span><span>Date added</span><span>Time</span><span /></div>
        {displayList.length ? displayList.map((song, index) => <SongRow key={song.id} song={song} index={index} active={song.id === currentSongId} isPlaying={isPlaying} liked={likedIds.has(song.id)} isPlaylistView={currentView !== 'library' && currentView !== 'liked'} onSelect={onSelect} onPlay={onPlay} onLike={onLike} onRemoveFromPlaylist={onRemoveFromPlaylist} onAddToPlaylist={onAddToPlaylist} />) : <div className="empty-state"><div>♫</div><p>No songs here yet.</p></div>}
      </section>
    </main>
  );
}
