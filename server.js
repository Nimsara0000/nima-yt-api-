const express = require('express');
const { execFile } = require('child_process');
const app = express();

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'YT-API running' });
});

// Audio URL එක ගන්න API එක
app.get('/api/audio', (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: 'YouTube URL එක අවශ්‍යයි' });
  }

  // yt-dlp එකෙන් audio stream URL එක විතරක් ගන්න
  const args = [
    '-f', 'bestaudio[ext=m4a]/bestaudio',
    '-g', // direct URL එක විතරක් print කරන්න
    '--no-playlist',
    '--no-warnings',
    videoUrl,
  ];

  // Cookies තියෙනවා නම් ඒකත් එකතු කරන්න
  if (process.env.YOUTUBE_COOKIES) {
    args.unshift('--cookies', process.env.YOUTUBE_COOKIES);
  }

  execFile('yt-dlp', args, { timeout: 30000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', stderr || error.message);
      return res.status(500).json({
        error: 'ඩවුන්ලෝඩ් කරන්න බැරි වුනා',
        details: stderr || error.message,
      });
    }

    const audioUrl = stdout.trim();
    if (!audioUrl) {
      return res.status(404).json({ error: 'Audio URL එකක් හම්බුනේ නැහැ' });
    }

    res.json({ audioUrl });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
