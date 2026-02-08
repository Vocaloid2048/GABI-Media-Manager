export function generateSongThumbnail(songName) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  const colorIndex = songName.charCodeAt(0) % colors.length;
  const backgroundColor = colors[colorIndex];

  return {
    backgroundColor,
    initial: songName.charAt(0).toUpperCase()
  };
}

export function formatCopyrightInfo(copyright) {
  const parsed = typeof copyright === 'string' ? JSON.parse(copyright || '{}') : copyright || {};

  return {
    composer: parsed.composer || '',
    lyricist: parsed.lyricist || '',
    arranger: parsed.arranger || '',
    publisher: parsed.publisher || ''
  };
}

export function createDownloadHandler(locale) {
  return async (song) => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`/api/song/${song.song_id}/download`, {
        headers: {
          'user_id': userId
        }
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${song.song_name}.pro`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert(locale('song.download_failed'));
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(locale('song.download_failed'));
    }
  };
}