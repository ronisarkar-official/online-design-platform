import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return new NextResponse('Image is required', { status: 400 });
    }

    const apiKey = process.env.REMOVE_BG_API_KEY || process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY;

    if (!apiKey) {
      return new NextResponse('API key not configured', { status: 500 });
    }

    // Remove data:image/png;base64, prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        image_file_b64: base64Data,
        size: 'auto',
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Remove.bg API error:', errorText);
        return new NextResponse(`Remove.bg API Error: ${response.statusText}`, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ result_b64: data.data.result_b64 });

  } catch (error) {
    console.error('Remove background error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
