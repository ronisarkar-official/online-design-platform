import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;
const BASE_URL = 'https://www.googleapis.com/webfonts/v1/webfonts';

export async function GET(req: NextRequest) {
	if (!API_KEY) {
		return new NextResponse('NEXT_PUBLIC_GOOGLE_FONTS_API_KEY is not configured', {
			status: 500,
		});
	}

	const { searchParams } = req.nextUrl;
	const sort = searchParams.get('sort');
	const category = searchParams.get('category');

	const url = new URL(BASE_URL);
	url.searchParams.set('key', API_KEY);
	if (sort) url.searchParams.set('sort', sort);
	if (category) url.searchParams.set('category', category);

	try {
		const res = await fetch(url.toString(), {
			// Cache on the server for 24 h — fonts don't change often
			next: { revalidate: 86400 },
		});

		if (!res.ok) {
			const body = await res.text().catch(() => '');
			console.error('[/api/fonts] Google Fonts error:', res.status, body);
			return new NextResponse(body || res.statusText, { status: res.status });
		}

		const data = await res.json();

		return NextResponse.json(data, {
			headers: {
				// Also cache at the edge / browser for 24 h
				'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
			},
		});
	} catch (err) {
		console.error('[/api/fonts] Unexpected error:', err);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
