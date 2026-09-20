import ytdl from '@distube/ytdl-core';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return NextResponse.json(
      { error: 'YouTube URL එක අවශ්‍යයි. උදා: ?url=https://youtu.be/xxxx' },
      { status: 400 }
    );
  }

  try {
    // Vercel එකේ තියෙන cookies ටික ගන්න
    const cookiesString = process.env.YOUTUBE_COOKIES;
    let agent;

    if (cookiesString) {
      // cookies.txt කියවලා agent එකක් හදන්න
      const cookies = cookiesString
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => {
          const parts = line.split('\t');
          return {
            domain: parts[0],
            path: parts[2],
            secure: parts[3] === 'TRUE',
            expirationDate: parseInt(parts[4]) || undefined,
            name: parts[5],
            value: parts[6],
          };
        });
      
      agent = ytdl.createAgent(cookies);
    }

    // Agent එක එක්ක info ගන්න
    const info = await ytdl.getInfo(videoUrl, agent ? { agent } : {});
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    if (!audioFormats.length) {
      return NextResponse.json(
        { error: 'මේ වීඩියෝ එකට audio format නැහැ' },
        { status: 404 }
      );
    }

    const bestAudio = audioFormats.sort(
      (a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0)
    )[0];

    return NextResponse.json({
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      duration: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails.pop()?.url,
      audioUrl: bestAudio.url,
      bitrate: bestAudio.audioBitrate,
      container: bestAudio.container,
      mimetype: bestAudio.mimeType,
    });
  } catch (error) {
    console.error('Actual Error:', error.message);
    return NextResponse.json(
      { error: 'ඩවුන්ලෝඩ් කරන්න බැරි වුනා.', details: error.message },
      { status: 500 }
    );
  }
}
