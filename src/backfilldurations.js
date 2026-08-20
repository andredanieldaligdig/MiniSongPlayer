import { supabase } from './supabase';

function getAudioDuration(url) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
    audio.addEventListener('error', () => reject(new Error(`Could not load: ${url}`)));
    audio.src = url;
  });
}

// Call this once (e.g. from a temporary button, or the browser console)
// to fill in `duration` for every song that doesn't have one yet.
export async function backfillDurations() {
  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, title, audio_url, duration')
    .is('duration', null);

  if (error) throw error;

  console.log(`Found ${songs.length} songs missing duration.`);

  for (const song of songs) {
    try {
      const seconds = await getAudioDuration(song.audio_url);
      const rounded = Math.round(seconds);
      const { error: updateError } = await supabase
        .from('songs')
        .update({ duration: rounded })
        .eq('id', song.id);
      if (updateError) throw updateError;
      console.log(`✓ ${song.title}: ${rounded}s`);
    } catch (err) {
      console.warn(`✗ ${song.title}: ${err.message}`);
    }
  }

  console.log('Backfill complete.');
}