import { useState, useRef, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import PlayerBar from './components/PlayerBar';
import PlaylistModal from './components/PlaylistModal';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import SavingOverlay from './components/SavingOverlay';
import Toast from './components/Toast';
import DetailsPanel from './components/DetailsPanel';
import { loadAudioDuration } from './helper';
import {
  dbLoadSongs,
  dbLoadPlaylists, dbInsertPlaylist, dbUpdatePlaylist, dbDeletePlaylist
} from './supabase';

const LIKED_KEY = 'tunes_liked';

export default function App() {
  // ── Data ──────────────────────────────────────────────────────────────
  const [songs, setSongs]         = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);

  // ── UI ────────────────────────────────────────────────────────────────
  const [currentView,   setCurrentView]   = useState('library');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [likedIds,      setLikedIds]      = useState(
    () => new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]'))
  );

  // ── Queue / Playback ──────────────────────────────────────────────────
  const [queue,       setQueue]       = useState([]);
  const [queueIdx,    setQueueIdx]    = useState(0);
  const [shuffle,     setShuffle]     = useState(false);
  const [repeatMode,  setRepeatMode]  = useState('off'); // 'off' | 'all' | 'one'
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [volume,      setVolumeState] = useState(0.7);
  const [muted,       setMuted]       = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);

  // ── Modals ────────────────────────────────────────────────────────────
  const [playlistModalOpen,  setPlaylistModalOpen]  = useState(false);
  const [addToPlModalOpen,   setAddToPlModalOpen]   = useState(false);
  const [addToPlSongId,      setAddToPlSongId]      = useState(null);

  // ── Feedback ──────────────────────────────────────────────────────────
  const [saving,     setSaving]    = useState(false);
  const [savingMsg,  setSavingMsg] = useState('Saving…');
  const [toastState, setToastState] = useState({ msg: '', show: false, isError: false });

  // ── Refs ──────────────────────────────────────────────────────────────
  const audioRef     = useRef(null);
  const toastTimer   = useRef(null);
  // Always-fresh state for use inside audio event handlers
  const latestRef    = useRef({});
  latestRef.current  = { queue, queueIdx, repeatMode, songs, shuffle };

  // ── Init audio once on mount ──────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.7;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      const { queue: q, queueIdx: idx, repeatMode: rm, songs: s } = latestRef.current;
      if (rm === 'one') { audio.currentTime = 0; audio.play(); return; }
      let newIdx;
      if      (idx < q.length - 1) newIdx = idx + 1;
      else if (rm === 'all')        newIdx = 0;
      else { setIsPlaying(false); return; }
      setQueueIdx(newIdx);
      const next = s.find(song => song.id === q[newIdx]);
      if (next) loadAndPlaySong(audio, next);
    };
    const onError = () => {
      setTimeout(() => {
        const { queue: q, queueIdx: idx, songs: s } = latestRef.current;
        if (idx < q.length - 1) {
          const newIdx = idx + 1;
          setQueueIdx(newIdx);
          const next = s.find(song => song.id === q[newIdx]);
          if (next) loadAndPlaySong(audio, next);
        }
      }, 300);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended',      onEnded);
    audio.addEventListener('error',      onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended',      onEnded);
      audio.removeEventListener('error',      onError);
    };
  }, []);

  // ── Load initial data ─────────────────────────────────────────────────
  useEffect(() => {
  async function init() {
    setSaving(true); setSavingMsg('Loading…');
    try {
      const [s, p] = await Promise.all([dbLoadSongs(), dbLoadPlaylists()]);
      setSongs(s);
      setPlaylists(p);
      if (s.length) setQueue(s.map(song => song.id));

    } catch (err) {
      showToast('Failed to load: ' + err.message, true);
    } finally {
      setSaving(false);
    }
  }
  init();
}, []);

  useEffect(() => {
    const missingDurations = songs.filter(song => !song.duration && song.audioUrl);
    if (!missingDurations.length) return;
    let cancelled = false;
    Promise.all(missingDurations.map(async song => [song.id, await loadAudioDuration(song.audioUrl)]))
      .then(results => {
        if (cancelled) return;
        const durations = new Map(results.filter(([, value]) => value !== null));
        if (!durations.size) return;
        setSongs(previous => previous.map(song => durations.has(song.id) ? { ...song, duration: durations.get(song.id) } : song));
      });
    return () => { cancelled = true; };
  }, [songs]);

  // ── Helpers ───────────────────────────────────────────────────────────
  function showToast(msg, isError = false) {
    setToastState({ msg, show: true, isError });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => setToastState(t => ({ ...t, show: false })), 3000
    );
  }

  function loadAndPlaySong(audio, song) {
    const src = song.audioData || song.audioUrl || '';
    if (!src) { showToast('No audio source for this song.', true); return; }
    audio.src = src;
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }

  // ── Display list (what's visible in the song list right now) ──────────
  const displayList = useMemo(() => {
    let list;
    if (currentView === 'library') {
      list = [...songs];
    } else if (currentView === 'liked') {
      list = songs.filter(s => likedIds.has(s.id));
    } else {
      const pl  = playlists.find(p => p.id === currentView);
      const ids = pl ? (pl.songIds || []) : [];
      list = ids.map(id => songs.find(s => s.id === id)).filter(Boolean);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        (s.title  || '').toLowerCase().includes(q) ||
        (s.artist || '').toLowerCase().includes(q) ||
        (s.album  || '').toLowerCase().includes(q)
      );
    }

    if (currentFilter === 'az')     list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    if (currentFilter === 'recent') list = [...list].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));

    return list;
  }, [songs, playlists, currentView, searchQuery, currentFilter, likedIds]);

  // ── Current song ──────────────────────────────────────────────────────
  const currentSong = useMemo(
    () => songs.find(s => s.id === queue[queueIdx]) || null,
    [songs, queue, queueIdx]
  );

  // ── Playback ──────────────────────────────────────────────────────────
  function buildQueue(startId, currentShuffle) {
    let ids = displayList.map(s => s.id);
    let idx = ids.indexOf(startId);
    if (idx < 0) idx = 0;
    if (currentShuffle) {
      const others = ids.filter(id => id !== startId);
      for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
      }
      ids = [startId, ...others];
      idx = 0;
    }
    return { ids, idx };
  }

  function playSongById(id) {
    const { ids, idx } = buildQueue(id, shuffle);
    setQueue(ids);
    setQueueIdx(idx);
    const song = songs.find(s => s.id === id);
    if (song) loadAndPlaySong(audioRef.current, song);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (!audio.src && currentSong) loadAndPlaySong(audio, currentSong);
      else audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }

  function prevSong() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.currentTime > 4) { audio.currentTime = 0; return; }
    const { queue: q, queueIdx: idx, songs: s } = latestRef.current;
    const newIdx = idx > 0 ? idx - 1 : (repeatMode === 'all' ? q.length - 1 : idx);
    setQueueIdx(newIdx);
    const song = s.find(song => song.id === q[newIdx]);
    if (song) loadAndPlaySong(audio, song);
  }

  function nextSong() {
    const audio = audioRef.current;
    if (!audio) return;
    const { queue: q, queueIdx: idx, songs: s } = latestRef.current;
    let newIdx;
    if      (idx < q.length - 1) newIdx = idx + 1;
    else if (repeatMode === 'all') newIdx = 0;
    else { audio.pause(); setIsPlaying(false); return; }
    setQueueIdx(newIdx);
    const song = s.find(song => song.id === q[newIdx]);
    if (song) loadAndPlaySong(audio, song);
  }

  function toggleShuffle() {
    const next = !shuffle;
    setShuffle(next);
    if (next && currentSong) {
      const { ids } = buildQueue(currentSong.id, true);
      setQueue(ids);
      setQueueIdx(0);
    }
    showToast(next ? 'Shuffle on' : 'Shuffle off');
  }

  function toggleRepeat() {
    const next = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    setRepeatMode(next);
    showToast(next === 'all' ? 'Repeat all songs' : next === 'one' ? 'Repeat one song' : 'Repeat off');
  }

  function seek(pct) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = (audio.duration || 0) * Math.max(0, Math.min(1, pct));
  }

  function handleSetVolume(v) {
    const audio = audioRef.current;
    if (!audio) return;
    const vol = Math.max(0, Math.min(1, v));
    setVolumeState(vol);
    const shouldMute = vol === 0;
    setMuted(shouldMute);
    audio.volume   = vol;
    audio.muted    = shouldMute;
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    setMuted(next);
    audio.muted = next;
  }

  // ── Like ──────────────────────────────────────────────────────────────
  function toggleLike(id) {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(LIKED_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  // ── Playlists ─────────────────────────────────────────────────────────
  async function savePlaylist(name) {
    setPlaylistModalOpen(false);
    setSaving(true); setSavingMsg('Creating playlist…');
    try {
      const pl       = { name, songIds: [], createdAt: Date.now() };
      const inserted = await dbInsertPlaylist(pl);
      setPlaylists(prev => [...prev, inserted]);
      showToast('Playlist created!');
    } catch (err) {
      showToast('Error: ' + err.message, true);
    } finally {
      setSaving(false);
    }
  }

  async function deletePlaylist(id) {
    if (!confirm('Delete this playlist?')) return;
    setSaving(true); setSavingMsg('Deleting playlist…');
    try {
      await dbDeletePlaylist(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
      if (currentView === id) setCurrentView('library');
      showToast('Playlist deleted.');
    } catch (err) {
      showToast('Error: ' + err.message, true);
    } finally {
      setSaving(false);
    }
  }

  async function addSongToPlaylist(playlistId, songId) {
    setAddToPlModalOpen(false);
    setSaving(true); setSavingMsg('Adding to playlist…');
    try {
      const pl         = playlists.find(p => p.id === playlistId);
      if (!pl) throw new Error('Playlist not found');
      if ((pl.songIds || []).includes(songId)) {
        showToast(`"${pl.name}" already contains this song.`);
        return;
      }
      const newSongIds = [...(pl.songIds || []), songId];
      await dbUpdatePlaylist(playlistId, { ...pl, songIds: newSongIds });
      setPlaylists(prev =>
        prev.map(p => p.id === playlistId ? { ...p, songIds: newSongIds } : p)
      );
      showToast(`Added to "${pl.name}"`);
    } catch (err) {
      showToast('Error: ' + err.message, true);
    } finally {
      setSaving(false);
    }
  }

  async function removeSongFromPlaylist(songId) {
    const pl = playlists.find(playlist => playlist.id === currentView);
    if (!pl) return;
    setSaving(true); setSavingMsg('Removing from playlist…');
    try {
      const newSongIds = (pl.songIds || []).filter(id => id !== songId);
      await dbUpdatePlaylist(pl.id, { ...pl, songIds: newSongIds });
      setPlaylists(prev => prev.map(playlist => playlist.id === pl.id ? { ...playlist, songIds: newSongIds } : playlist));
      showToast(`Removed from "${pl.name}".`);
    } catch (err) {
      showToast('Error removing song: ' + err.message, true);
    } finally {
      setSaving(false);
    }
  }

  function openAddToPlaylist(songId) {
    setAddToPlSongId(songId);
    setAddToPlModalOpen(true);
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className={`app ${selectedSong ? 'details-open' : ''} ${playerReady ? 'player-open' : ''}`}>
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        playlists={playlists}
        onNewPlaylist={() => setPlaylistModalOpen(true)}
        onDeletePlaylist={deletePlaylist}
      />
      <MainContent
        displayList={displayList}
        currentView={currentView}
        currentFilter={currentFilter}
        setCurrentFilter={setCurrentFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        playlists={playlists}
        likedIds={likedIds}
        currentSongId={currentSong?.id}
        isPlaying={isPlaying}
        onSelect={song => { setSelectedSong(song); setPlayerReady(true); }}
        onPlay={playSongById}
        onLike={toggleLike}
        onRemoveFromPlaylist={removeSongFromPlaylist}
        onAddToPlaylist={openAddToPlaylist}
      />
      <DetailsPanel song={selectedSong} onClose={() => setSelectedSong(null)} />
      {playerReady && <PlayerBar
          currentSong={currentSong}
          isPlaying={isPlaying}
          shuffle={shuffle}
          repeatMode={repeatMode}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          muted={muted}
          onTogglePlay={togglePlay}
          onPrev={prevSong}
          onNext={nextSong}
          onToggleShuffle={toggleShuffle}
          onToggleRepeat={toggleRepeat}
          onSeek={seek}
          onSetVolume={handleSetVolume}
          onToggleMute={toggleMute}
        />}
      <PlaylistModal
        open={playlistModalOpen}
        onClose={() => setPlaylistModalOpen(false)}
        onSave={savePlaylist}
      />
      <AddToPlaylistModal
        open={addToPlModalOpen}
        onClose={() => setAddToPlModalOpen(false)}
        songId={addToPlSongId}
        playlists={playlists}
        onAdd={addSongToPlaylist}
      />
      <SavingOverlay show={saving} msg={savingMsg} />
      <Toast msg={toastState.msg} show={toastState.show} isError={toastState.isError} />
    </div>
  );
}