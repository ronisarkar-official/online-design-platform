export type GoogleFontCategory =
	| 'serif'
	| 'sans-serif'
	| 'display'
	| 'handwriting'
	| 'monospace';

export interface GoogleFont {
	family: string;
	category: GoogleFontCategory;
	variants: string[];
	subsets: string[];
}

export interface GoogleFontsResponse {
	items: GoogleFont[];
}

/**
 * Fetches fonts via the /api/fonts proxy route.
 * The API key is kept server-side, so IP / referrer restrictions don't apply.
 *
 * Valid sort values: 'alpha' | 'date' | 'popularity' | 'style' | 'trending'
 */
export async function fetchGoogleFonts(params?: {
	sort?: 'popularity' | 'trending' | 'date' | 'alpha' | 'style';
	category?: GoogleFontCategory;
	signal?: AbortSignal;
}): Promise<GoogleFont[]> {
	const url = new URL('/api/fonts', window.location.origin);
	if (params?.sort) url.searchParams.set('sort', params.sort);
	if (params?.category) url.searchParams.set('category', params.category);

	const res = await fetch(url.toString(), {
		signal: params?.signal,
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '(no body)');
		throw new Error(`Google Fonts API ${res.status}: ${body}`);
	}

	const data: GoogleFontsResponse = await res.json();
	return data.items ?? [];
}
