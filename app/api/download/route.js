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
    // YouTube video info ගන්න
    const info = await ytdl.getInfo(videoUrl);

    // audio-only formats විතරක් filter කරන්න
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    if (!audioFormats.length) {
      return NextResponse.json(
        { error: 'මේ වීඩියෝ එකට audio format නැහැ' },
        { status: 404 }
      );
    }

    // හොඳම bitrate එක තෝරන්න
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
    // ඇත්ත error එක මෙතනින් console එකට යයි
    console.error('Actual Error:', error.message);
    
    return NextResponse.json(
      { 
        error: 'ඩවුන්ලෝඩ් කරන්න බැරි වුනා.',
        details: error.message // මේකෙන් ඇත්ත ප්‍රශ්නය පේනවා
      },
      { status: 500 }
    );
  }
}
