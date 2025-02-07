export type Source = "arxiv" | "medrxiv" | "biorxiv" | "pubmed" | "hackernews";

export interface Paper {
    id: string;
    title: string;
    summary: string;
    authors: string[];
    published: string;
    pdfLink?: string;
    source: Source;
    category?: string;
    institution?: string;
}

export interface FetchOptions {
    page: number;
    perPage: number;
    queries?: string[];
    source?: Source;
}

export async function fetchPapers({
    page,
    perPage,
    queries,
    source = "arxiv",
}: FetchOptions): Promise<Paper[]> {
    const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        source: source,
    });

    if (queries?.length) {
        params.set("q", queries.join("|"));
    }

    const response = await fetch(`/api/papers?${params}`);
    if (!response.ok) {
        throw new Error("Failed to fetch papers");
    }
    return response.json();
}
