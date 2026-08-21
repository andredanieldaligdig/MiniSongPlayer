import { useRef } from 'react';
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { fmt } from '../helper';

export default function PlayerBar({ currentSong, isPlaying, shuffle, repeatMode, currentTime, duration, volume, muted, onTogglePlay, onPrev, onNext, onToggleShuffle, onToggleRepeat, onSeek, onSetVolume, onToggleMute }) {
  const volumeTrackRef = useRef(null);
  const draggingVolume = useRef(false);
  function seekFromEvent(event) { const rect = event.currentTarget.getBoundingClientRect(); onSeek((event.clientX - rect.left) / rect.width); }
  function volumeFromEvent(event) {
    const rect = volumeTrackRef.current.getBoundingClientRect();
    onSetVolume((event.clientX - rect.left) / rect.width);
  }
  function startVolumeDrag(event) {
    draggingVolume.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    volumeFromEvent(event);
  }
  function moveVolumeDrag(event) { if (draggingVolume.current) volumeFromEvent(event); }
  function endVolumeDrag(event) {
    draggingVolume.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  const cover = currentSong?.coverData || currentSong?.coverUrl;
  const volumeIcon = muted ? <VolumeX className="volume-icon muted" aria-hidden="true" /> : volume === 0 ? <Volume className="volume-icon" aria-hidden="true" /> : volume < 0.34 ? <Volume1 className="volume-icon" aria-hidden="true" /> : <Volume2 className="volume-icon" aria-hidden="true" />;
  return <footer className="player-bar">
    <div className="now-playing"><div className="now-cover">{cover ? <img src={cover} alt="" /> : ''}</div><div style={{ minWidth: 0 }}><div className="now-title">{currentSong?.title || 'Nothing playing'}</div><div className="now-artist">{currentSong?.artist || 'Choose a song to begin'}</div></div></div>
    <div className="player-center"><div className="controls"><button className={`ctrl ${shuffle ? 'on' : ''}`} onClick={onToggleShuffle} title={shuffle ? 'Shuffle on' : 'Shuffle off'} aria-label={shuffle ? 'Shuffle on' : 'Shuffle off'}>⇄</button><button className="ctrl" onClick={onPrev} title="Previous" aria-label="Previous song"><span className="transport-icon prev-icon" /></button><button className="play-pause" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}><span className={isPlaying ? 'pause-icon' : 'play-icon'} /></button><button className="ctrl" onClick={onNext} title="Next" aria-label="Next song"><span className="transport-icon next-icon" /></button><button className={`ctrl ${repeatMode !== 'off' ? 'on' : ''}`} onClick={onToggleRepeat} title={`Repeat ${repeatMode}`} aria-label={`Repeat ${repeatMode}`}>↻</button></div><div className="progress-row"><span className="time">{fmt(currentTime)}</span><div className="progress-track" onClick={seekFromEvent}><div className="progress-fill" style={{ width: `${duration ? currentTime / duration * 100 : 0}%` }} /></div><span className="time">{fmt(duration)}</span></div></div>
    <div className="player-right"><button className="ctrl volume-btn" onClick={onToggleMute} title={muted ? 'Unmute' : 'Mute'} aria-label={muted ? 'Unmute' : 'Mute'}>
      {volumeIcon}
    </button><div ref={volumeTrackRef} className="vol-track" onPointerDown={startVolumeDrag} onPointerMove={moveVolumeDrag} onPointerUp={endVolumeDrag} onPointerCancel={endVolumeDrag} role="slider" aria-label="Volume" aria-valuemin="0" aria-valuemax="1" aria-valuenow={muted ? 0 : volume} tabIndex="0"><div className="vol-fill" style={{ width: `${muted ? 0 : volume * 100}%` }} /></div></div>
  </footer>;
}
