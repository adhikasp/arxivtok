import type { APIEvent } from "@solidjs/start/server";
import { parseStringPromise } from 'xml2js';

const ARXIV_API_URL = "http://export.arxiv.org/api/query";

export async function GET({ request }: APIEvent) {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 0;
    const perPage = Number(url.searchParams.get('perPage')) || 10;
    const query = url.searchParams.get('q') || '';
    const start = page * perPage;

    let searchQuery = '';
    if (query) {
        const terms = query.split(' ').map(term => `all:${term}`).join(' AND ');
        searchQuery = encodeURIComponent(`(${terms}) AND (cat:cs.* OR cat:stat.ML)`);
    } else {
        searchQuery = encodeURIComponent("cat:cs.AI OR cat:cs.LG");
    }

    const arxivUrl = `${ARXIV_API_URL}?search_query=${searchQuery}&start=${start}&max_results=${perPage}&sortBy=submittedDate&sortOrder=descending`;

    console.log("🚀 ~ GET ~ arxivUrl:", arxivUrl)
    try {
        const response = await fetch(arxivUrl);
        const xmlData = await response.text();
        const result = await parseStringPromise(xmlData);
        
        const entries = result.feed.entry || [];
        const papers = Array.isArray(entries) ? entries.map(transformEntry) : [transformEntry(entries)];

        return new Response(JSON.stringify(papers), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: "Failed to fetch papers" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

function transformEntry(entry: any) {
    return {
        id: entry.id?.[0],
        title: entry.title?.[0]?.replace(/\s+/g, ' ').trim(),
        summary: entry.summary?.[0]?.replace(/\s+/g, ' ').trim(),
        authors: entry.author?.map((author: any) => author.name?.[0]) || [],
        published: entry.published?.[0],
        pdfLink: entry.link?.find((link: any) => link.$?.title === 'pdf')?.$?.href
    };
}
