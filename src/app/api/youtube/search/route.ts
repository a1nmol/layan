import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  const pageToken = req.nextUrl.searchParams.get("pageToken") || "";

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YouTube API key not configured" }, { status: 503 });
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    videoCategoryId: "10", // Music category
    maxResults: "20",
    key: apiKey,
    ...(pageToken ? { pageToken } : {}),
  });

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    );
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "YouTube API error" },
        { status: res.status }
      );
    }

    // Fetch durations via videos endpoint
    const ids = data.items
      ?.map((item: { id: { videoId: string } }) => item.id.videoId)
      .filter(Boolean)
      .join(",");

    let durations: Record<string, number> = {};
    if (ids) {
      const vRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${apiKey}`
      );
      const vData = await vRes.json();
      vData.items?.forEach((v: { id: string; contentDetails: { duration: string } }) => {
        durations[v.id] = parseISO8601Duration(v.contentDetails.duration);
      });
    }

    const results = data.items?.map((item: {
      id: { videoId: string };
      snippet: {
        title: string;
        channelTitle: string;
        thumbnails: { high?: { url: string }; medium?: { url: string } };
        publishedAt: string;
      };
    }) => ({
      videoId: item.id.videoId,
      title: decodeHtml(item.snippet.title),
      channel: item.snippet.channelTitle,
      thumbnail:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        "",
      publishedAt: item.snippet.publishedAt,
      duration: durations[item.id.videoId] || 0,
    }));

    return NextResponse.json({
      results: results || [],
      nextPageToken: data.nextPageToken || null,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  return h * 3600 + m * 60 + s;
}

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
