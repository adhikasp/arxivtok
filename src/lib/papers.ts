export type Source = 'arxiv' | 'medrxiv';

export interface FetchOptions {
    page: number;
    perPage: number;
    query?: string;
    source?: Source;
}

export async function fetchPapers({ page, perPage, query, source = 'arxiv' }: FetchOptions) {
    const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        source: source,
    });
    
    if (query) {
        params.set('q', query);
    }

    const response = await fetch(`/api/papers?${params}`);
    if (!response.ok) {
        throw new Error('Failed to fetch papers');
    }
    return response.json();
}
