import type { APIEvent } from "@solidjs/start/server";
import { parseStringPromise } from 'xml2js';

const ARXIV_API_URL = "http://export.arxiv.org/api/query";
const MEDRXIV_API_URL = "https://api.medrxiv.org/details/medrxiv";

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

async function fetchArxiv(query: string, page: number, perPage: number) {
    const start = page * perPage;
    let searchQuery = '';
    
    if (query) {
        const terms = query.split(' ').map(term => `all:${term}`).join(' AND ');
        searchQuery = encodeURIComponent(terms);
    } else {
        searchQuery = encodeURIComponent("physics OR cs OR math OR q-bio OR q-fin OR AI");
    }

    const arxivUrl = `${ARXIV_API_URL}?search_query=${searchQuery}&start=${start}&max_results=${perPage}&sortBy=submittedDate&sortOrder=descending`;

    try {
        const response = await fetch(arxivUrl);
        const xmlData = await response.text();
        const result = await parseStringPromise(xmlData);
        
        const entries = result.feed.entry || [];
        const papers = Array.isArray(entries) ? entries.map(transformArxivEntry) : [transformArxivEntry(entries)];

        return new Response(JSON.stringify(papers), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return handleError(error);
    }
}

async function fetchMedrxiv(query: string, page: number, perPage: number) {
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
        const data = await response.json();

        if (!data.collection || !Array.isArray(data.collection)) {
            console.error('Medrxiv API response:', data);
            return new Response(JSON.stringify([]), {
                headers: { "Content-Type": "application/json" },
            });
        }

        let results = data.collection;

        if (query) {
            const queryLower = query.toLowerCase();
            results = results.filter((paper: any) => 
                paper.title.toLowerCase().includes(queryLower) ||
                paper.abstract.toLowerCase().includes(queryLower)
            );
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
