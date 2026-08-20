import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment settings.');
  }
  return supabase;
}

// ── Mappers: snake_case (DB) <-> camelCase (app.jsx expects) ──────────────
function mapSong(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    audioUrl: row.audio_url,
    coverUrl: row.cover_url,
    duration: row.duration,   // ← add this line
    addedAt: row.added_at ? new Date(row.added_at).getTime() : 0,
  };
}

function mapPlaylist(row) {
  return {
    id: row.id,
    name: row.name,
    songIds: row.song_ids || [],
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
  };
}

// ── Songs ───────────────────────────────────────────────────────────────
export async function dbLoadSongs() {
  const { data, error } = await requireSupabase()
    .from('songs')
    .select('*')
    .order('added_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapSong);
}

export async function dbDeleteSong(id) {
  const { error } = await requireSupabase().from('songs').delete().eq('id', id);
  if (error) throw error;
}

// ── Playlists ───────────────────────────────────────────────────────────
export async function dbLoadPlaylists() {
  const { data, error } = await requireSupabase()
    .from('playlists')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapPlaylist);
}

export async function dbInsertPlaylist(pl) {
  const { data, error } = await requireSupabase()
    .from('playlists')
    .insert({ name: pl.name, song_ids: pl.songIds || [] })
    .select()
    .single();
  if (error) throw error;
  return mapPlaylist(data);
}

export async function dbUpdatePlaylist(id, pl) {
  const { data, error } = await requireSupabase()
    .from('playlists')
    .update({ name: pl.name, song_ids: pl.songIds || [] })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapPlaylist(data);
}

export async function dbDeletePlaylist(id) {
  const { error } = await requireSupabase().from('playlists').delete().eq('id', id);
  if (error) throw error;
}