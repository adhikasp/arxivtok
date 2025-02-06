import type { APIEvent } from "@solidjs/start/server";
import { parseStringPromise } from 'xml2js';

const ARXIV_API_URL = "https://export.arxiv.org/api/query";
const MEDRXIV_API_URL = "https://api.medrxiv.org/details/medrxiv";

interface ArxivEntry {
    id: string[];
    title: string[];
    summary: string[];
    author?: Array<{ name: string[] }>;
    published: string[];
    link?: Array<{ $: { title?: string; href?: string } }>;
}

interface MedrxivEntry {
    doi: string;
    title: string;
    abstract: string;
    authors: string;
    date: string;
    version: string;
    category: string;
    author_corresponding_institution: string;
}

interface ArxivResponse {
    feed: {
        entry?: ArxivEntry | ArxivEntry[];
    };
}

interface MedrxivResponse {
    collection?: MedrxivEntry[];
}

export async function GET({ request }: APIEvent) {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 0;
    const perPage = Number(url.searchParams.get('perPage')) || 10;
    const query = url.searchParams.get('q') || '';
    const source = url.searchParams.get('source') || 'arxiv';
    
    if (source === 'medrxiv') {
        return await fetchMedrxiv(query, page, perPage);
    }
    return await fetchArxiv(query, page, perPage);
}

async function fetchArxiv(query: string, page: number, perPage: number): Promise<Response> {
    const start = page * perPage;
    let searchQuery = '';

    if (query) {
        const queries = query.split('|').filter(Boolean);
        if (queries.length > 0) {
            const formattedQueries = queries.map(q => {
                // Procesamos cada término individualmente
                const terms = q.trim().split(' ').filter(Boolean);
                
                if (terms.length > 1) {
                    const combinedTerms = terms.map(term => 
                        `(abs:${term} OR ti:${term} OR all:${term})`
                    ).join(' AND ');
                    return `(${combinedTerms})`;
                } else {
                    return `(abs:${terms[0]} OR ti:${terms[0]} OR all:${terms[0]})`;
                }
            });

            searchQuery = formattedQueries.join(' AND ');
        }
    }

    const arxivUrl = `${ARXIV_API_URL}?search_query=${encodeURIComponent(searchQuery)}&start=${start}&max_results=${perPage}&sortBy=submittedDate&sortOrder=descending`;
    console.log("🚀 ~ Query:", searchQuery);
    console.log("🚀 ~ URL:", decodeURIComponent(arxivUrl));

    try {
        const response = await fetch(arxivUrl);
        const xmlData = await response.text();
        const result = await parseStringPromise(xmlData) as ArxivResponse;
        
        const entries = result.feed.entry || [];
        const papers = Array.isArray(entries) ? entries.map(transformArxivEntry) : [transformArxivEntry(entries)];

        return new Response(JSON.stringify(papers), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return handleError(error);
    }
}

async function fetchMedrxiv(query: string, page: number, perPage: number): Promise<Response> {
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const dateFormat = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        const cursor = page * perPage;
        const url = `${MEDRXIV_API_URL}/${dateFormat(thirtyDaysAgo)}/${dateFormat(today)}/${cursor}/json`;

        const response = await fetch(url);
        const data = await response.json() as MedrxivResponse;

        if (!data.collection || !Array.isArray(data.collection)) {
            console.error('Medrxiv API response:', data);
            return new Response(JSON.stringify([]), {
                headers: { "Content-Type": "application/json" },
            });
        }

        let results = data.collection;
            console.log("🚀 ~ fetchMedrxiv ~ query:", query);

        if (query) {
            const queries = query.split('|')
                .filter(Boolean)
                .map(q => q.trim().toLowerCase());
            
            if (queries.length > 0) {
                results = results.filter((paper: any) => 
                    queries.some(q => {
                        const terms = q.split(' ').filter(Boolean);
                        return terms.every(term =>
                            paper.title.toLowerCase().includes(term) ||
                            paper.abstract.toLowerCase().includes(term)
                        );
                    })
                );
            }
        }

        results = results.slice(0, perPage);
        const papers = results.map(transformMedrxivEntry);

        return new Response(JSON.stringify(papers), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return handleError(error);
    }
}

function transformArxivEntry(entry: any) {
    return {
        id: entry.id?.[0],
        title: entry.title?.[0]?.replace(/\s+/g, ' ').trim(),
        summary: entry.summary?.[0]?.replace(/\s+/g, ' ').trim(),
        authors: entry.author?.map((author: any) => author.name?.[0]) || [],
        published: entry.published?.[0],
        pdfLink: entry.link?.find((link: any) => link.$?.title === 'pdf')?.$?.href,
        source: 'arxiv'
    };
}

function transformMedrxivEntry(entry: any) {
    return {
        id: entry.doi,
        title: entry.title,
        summary: entry.abstract,
        authors: entry.authors.split('; '),
        published: entry.date,
        pdfLink: `https://www.medrxiv.org/content/${entry.doi}v${entry.version}.full.pdf`,
        source: 'medrxiv',
        category: entry.category,
        institution: entry.author_corresponding_institution
    };
}

function handleError(error: any) {
    console.error(error);
    return new Response(
        JSON.stringify({ error: "Failed to fetch papers" }),
        {
            status: 500,
            headers: { "Content-Type": "application/json" },
        }
    );
}
