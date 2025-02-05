export interface FetchOptions {
    page: number;
    perPage: number;
    query?: string;
}

export async function fetchArxivPapers({ page, perPage, query }: FetchOptions) {
    const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
    });
    
    if (query) {
        params.set('q', query);
    }

    const response = await fetch(`/api/arxiv?${params}`);
    if (!response.ok) {
        throw new Error('Failed to fetch papers');
    }
    return response.json();
}
