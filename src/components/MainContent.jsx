import { EMOJIS } from '../helper';

function SongRow({ song, index, playing, liked, onPlay, onLike, onDelete, onAddToPlaylist }) {
  const cover = song.coverData || song.coverUrl;
  return (
    <div className={`song-row ${playing ? 'playing' : ''}`} onDoubleClick={() => onPlay(song.id)}>
      <div className="song-num">{playing ? <div className="wave-icon"><span /><span /><span /></div> : index + 1}</div>
      <div className="song-info">
        <div className="song-cover">{cover ? <img src={cover} alt="" /> : EMOJIS[index % EMOJIS.length]}</div>
        <div style={{ minWidth: 0 }}><div className="song-title">{song.title || 'Untitled'}</div><div className="song-sub">{song.artist || 'Unknown artist'}</div></div>
      </div>
      <div className="col-text">{song.album || '—'}</div>
      <div className="col-text">{song.genre || '—'}</div>
      <div className="col-mono">{song.duration || '—'}</div>
      <div className="row-actions">
        <button className="icon-btn" onClick={() => onLike(song.id)} title={liked ? 'Unlike' : 'Like'} aria-label={liked ? 'Unlike song' : 'Like song'}>{liked ? '♥' : '♡'}</button>
        <button className="icon-btn" onClick={() => onAddToPlaylist(song.id)} title="Add to playlist" aria-label="Add to playlist">＋</button>
        <button className="icon-btn" onClick={() => onDelete(song.id)} title="Delete song" aria-label="Delete song">×</button>
      </div>
    </div>
  );
}

export default function MainContent({ displayList, currentView, currentFilter, setCurrentFilter, searchQuery, setSearchQuery, playlists, likedIds, currentSongId, onPlay, onLike, onDelete, onAddToPlaylist }) {
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
          {[['all', 'All songs'], ['az', 'A–Z'], ['recent', 'Recently added']].map(([value, label]) => <button key={value} className={`tab ${currentFilter === value ? 'active' : ''}`} onClick={() => setCurrentFilter(value)}>{label}</button>)}
        </div>
      </header>
      <section className="song-list-wrap">
        <div className="col-header"><span>#</span><span>Title</span><span>Album</span><span>Genre</span><span>Time</span><span /></div>
        {displayList.length ? displayList.map((song, index) => <SongRow key={song.id} song={song} index={index} playing={song.id === currentSongId} liked={likedIds.has(song.id)} onPlay={onPlay} onLike={onLike} onDelete={onDelete} onAddToPlaylist={onAddToPlaylist} />) : <div className="empty-state"><div>♫</div><p>No songs here yet.</p></div>}
      </section>
    </main>
  );
}
