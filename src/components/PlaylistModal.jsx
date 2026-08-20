import { useState } from 'react';

export default function PlaylistModal({ open, onClose, onSave }) {
  const [name, setName] = useState('');
  function submit(event) { event.preventDefault(); const value = name.trim(); if (value) { onSave(value); setName(''); } }
  return <div className={`overlay ${open ? 'open' : ''}`} onMouseDown={event => event.target === event.currentTarget && onClose()}><form className="modal" onSubmit={submit}><div className="modal-title">New playlist</div><div className="form-group"><label className="form-label" htmlFor="playlist-name">Name</label><input id="playlist-name" className="form-input" autoFocus={open} value={name} onChange={event => setName(event.target.value)} placeholder="Playlist name" /></div><div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div></form></div>;
}
