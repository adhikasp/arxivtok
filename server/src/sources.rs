//! Paper sources: arXiv, medRxiv, bioRxiv, PubMed, Hacker News.

use crate::model::{Paper, Res};
use chrono::{Duration, TimeZone, Utc};
use futures::future::join_all;
use reqwest::Client;
use serde_json::Value;

const ARXIV_API: &str = "https://export.arxiv.org/api/query";
const MEDRXIV_API: &str = "https://api.medrxiv.org/details/medrxiv";
const BIORXIV_API: &str = "https://api.biorxiv.org/details/biorxiv";
const PUBMED_ESEARCH: &str = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const PUBMED_ESUMMARY: &str = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
const HN_API: &str = "https://hacker-news.firebaseio.com/v0";

pub async fn fetch(c: &Client, source: &str, q: &str, page: u32, per_page: u32) -> Res<Vec<Paper>> {
    match source {
        "medrxiv" => medrxiv(c, q, page, per_page).await,
        "biorxiv" => biorxiv(c, q, page, per_page).await,
        "pubmed" => pubmed(c, q, page, per_page).await,
        "hackernews" => hackernews(c, q, page, per_page).await,
        _ => arxiv(c, q, page, per_page).await,
    }
}

fn collapse_ws(s: &str) -> String {
    s.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn str_of(v: &Value, key: &str) -> String {
    v.get(key).and_then(Value::as_str).unwrap_or_default().to_string()
}

fn queries(q: &str) -> Vec<String> {
    q.split('|').map(|s| s.trim().to_lowercase()).filter(|s| !s.is_empty()).collect()
}

fn matches_all_terms(p: &Paper, q: &str) -> bool {
    let (t, a) = (p.title.to_lowercase(), p.summary.to_lowercase());
    q.split_whitespace().all(|term| t.contains(term) || a.contains(term))
}

// ---------- arXiv ----------

/// `a b|c` => `((abs:a OR ti:a OR all:a) AND (abs:b ...)) AND (abs:c OR ti:c OR all:c)`.
/// With no query, fall back to the newest computer-science papers (arXiv rejects `all:*` when sorted).
pub fn arxiv_query(q: &str) -> String {
    let clean: String = q
        .chars()
        .filter(|c| !c.is_control() && !matches!(c, '(' | ')' | '"' | ':'))
        .collect();
    let groups: Vec<String> = clean
        .split('|')
        .filter(|s| !s.trim().is_empty())
        .map(|g| {
            let terms: Vec<String> = g
                .split_whitespace()
                .map(|t| format!("(abs:{t} OR ti:{t} OR all:{t})"))
                .collect();
            if terms.len() > 1 { format!("({})", terms.join(" AND ")) } else { terms.concat() }
        })
        .filter(|s| !s.is_empty())
        .collect();
    if groups.is_empty() { "cat:cs.*".to_string() } else { groups.join(" AND ") }
}

async fn arxiv(c: &Client, q: &str, page: u32, per_page: u32) -> Res<Vec<Paper>> {
    let xml = c
        .get(ARXIV_API)
        .query(&[
            ("search_query", arxiv_query(q)),
            ("start", (page * per_page).to_string()),
            ("max_results", per_page.to_string()),
            ("sortBy", "submittedDate".into()),
            ("sortOrder", "descending".into()),
        ])
        .send()
        .await?
        .error_for_status()?
        .text()
        .await?;
    parse_arxiv(&xml)
}

pub fn parse_arxiv(xml: &str) -> Res<Vec<Paper>> {
    let doc = roxmltree::Document::parse(xml)?;
    fn kids<'a, 'i>(n: roxmltree::Node<'a, 'i>, name: &str) -> Vec<roxmltree::Node<'a, 'i>> {
        n.children().filter(|c| c.is_element() && c.tag_name().name() == name).collect()
    }
    let text = |n: roxmltree::Node<'_, '_>, name: &str| -> Option<String> {
        kids(n, name).first().and_then(|c| c.text()).map(collapse_ws)
    };
    let mut out = vec![];
    for e in kids(doc.root_element(), "entry") {
        let id = text(e, "id").unwrap_or_default();
        let title = text(e, "title").unwrap_or_default();
        // arXiv reports API errors as a single entry titled "Error".
        if title == "Error" && id.contains("/api/errors") {
            return Err(format!("arXiv: {}", text(e, "summary").unwrap_or_default()).into());
        }
        let mut p = Paper::new("arxiv", id, title, text(e, "summary").unwrap_or_default());
        p.authors = kids(e, "author").into_iter().filter_map(|a| text(a, "name")).collect();
        p.published = text(e, "published");
        p.pdf_link = kids(e, "link")
            .into_iter()
            .find(|l| l.attribute("title") == Some("pdf"))
            .and_then(|l| l.attribute("href"))
            .map(str::to_string);
        out.push(p);
    }
    Ok(out)
}

// ---------- medRxiv / bioRxiv ----------

fn date_range() -> (String, String) {
    let today = Utc::now();
    let f = |d: chrono::DateTime<Utc>| d.format("%Y-%m-%d").to_string();
    (f(today - Duration::days(30)), f(today))
}

fn rxiv_entry(source: &'static str, v: &Value, pdf: String) -> Paper {
    let mut p = Paper::new(source, str_of(v, "doi"), str_of(v, "title"), str_of(v, "abstract"));
    p.authors = str_of(v, "authors").split("; ").filter(|s| !s.is_empty()).map(str::to_string).collect();
    p.published = Some(str_of(v, "date"));
    p.pdf_link = Some(pdf);
    p
}

async fn medrxiv(c: &Client, q: &str, page: u32, per_page: u32) -> Res<Vec<Paper>> {
    let (from, to) = date_range();
    let url = format!("{MEDRXIV_API}/{from}/{to}/{}/json", page * per_page);
    let data: Value = c.get(url).send().await?.error_for_status()?.json().await?;
    let qs = queries(q);
    Ok(data["collection"]
        .as_array()
        .map(Vec::as_slice)
        .unwrap_or_default()
        .iter()
        .map(|v| {
            let pdf = format!("https://www.medrxiv.org/content/{}v{}.full.pdf", str_of(v, "doi"), str_of(v, "version"));
            let mut p = rxiv_entry("medrxiv", v, pdf);
            p.category = Some(str_of(v, "category"));
            p.institution = Some(str_of(v, "author_corresponding_institution"));
            p
        })
        .filter(|p| qs.is_empty() || qs.iter().any(|q| matches_all_terms(p, q)))
        .take(per_page as usize)
        .collect())
}

async fn biorxiv(c: &Client, q: &str, page: u32, per_page: u32) -> Res<Vec<Paper>> {
    let (from, to) = date_range();
    let url = format!("{BIORXIV_API}/{from}/{to}/{}/{per_page}", page * per_page);
    let data: Value = c.get(url).send().await?.error_for_status()?.json().await?;
    let qs = queries(q);
    Ok(data["collection"]
        .as_array()
        .map(Vec::as_slice)
        .unwrap_or_default()
        .iter()
        .map(|v| {
            let pdf = format!("https://www.biorxiv.org/content/{}v{}.full.pdf", str_of(v, "doi"), str_of(v, "version"));
            rxiv_entry("biorxiv", v, pdf)
        })
        .filter(|p| {
            // bioRxiv: every `|`-separated term must hit title or abstract.
            qs.iter().all(|t| p.title.to_lowercase().contains(t) || p.summary.to_lowercase().contains(t))
        })
        .take(per_page as usize)
        .collect())
}

// ---------- PubMed ----------

async fn pubmed(c: &Client, q: &str, page: u32, per_page: u32) -> Res<Vec<Paper>> {
    let search: Value = c
        .get(PUBMED_ESEARCH)
        .query(&[
            ("db", "pubmed"),
            ("term", q),
            ("retstart", &(page * per_page).to_string()),
            ("retmax", &per_page.to_string()),
            ("retmode", "json"),
        ])
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    let ids: Vec<String> = search["esearchresult"]["idlist"]
        .as_array()
        .map(|a| a.iter().filter_map(|v| v.as_str().map(str::to_string)).collect())
        .unwrap_or_default();
    if ids.is_empty() {
        return Ok(vec![]);
    }
    let summary: Value = c
        .get(PUBMED_ESUMMARY)
        .query(&[("db", "pubmed"), ("id", &ids.join(",")), ("retmode", "json")])
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    Ok(ids
        .iter()
        .filter_map(|id| summary["result"].get(id))
        .map(|d| {
            // esummary has no abstract; the title doubles as the summary.
            let title = str_of(d, "title");
            let mut p = Paper::new("pubmed", str_of(d, "uid"), title.clone(), title);
            p.authors = d["authors"]
                .as_array()
                .map(|a| a.iter().map(|x| str_of(x, "name")).collect())
                .unwrap_or_default();
            p.published = Some(str_of(d, "pubdate"));
            p
        })
        .collect())
}

// ---------- Hacker News ----------

async fn hackernews(c: &Client, q: &str, page: u32, per_page: u32) -> Res<Vec<Paper>> {
    let ids: Vec<u64> = c.get(format!("{HN_API}/topstories.json")).send().await?.error_for_status()?.json().await?;
    let start = (page * per_page) as usize;
    let page_ids: Vec<u64> = ids.into_iter().skip(start).take(per_page as usize).collect();
    let items = join_all(page_ids.into_iter().map(|id| async move {
        let r = c.get(format!("{HN_API}/item/{id}.json")).send().await.ok()?;
        r.json::<Value>().await.ok()
    }))
    .await;
    let ql = q.to_lowercase();
    Ok(items
        .into_iter()
        .flatten()
        .filter(|s| s.get("title").is_some())
        .filter(|s| ql.is_empty() || str_of(s, "title").to_lowercase().contains(&ql) || str_of(s, "text").to_lowercase().contains(&ql))
        .map(|s| {
            let title = str_of(&s, "title");
            let text = str_of(&s, "text");
            let mut p = Paper::new(
                "hackernews",
                format!("hn-{}", s["id"].as_u64().unwrap_or_default()),
                title.clone(),
                if text.is_empty() { title } else { text },
            );
            p.authors = vec![str_of(&s, "by")];
            p.published = s["time"].as_i64().and_then(|t| Utc.timestamp_opt(t, 0).single()).map(|d| d.to_rfc3339_opts(chrono::SecondsFormat::Millis, true));
            p.pdf_link = s.get("url").and_then(Value::as_str).map(str::to_string);
            p
        })
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn arxiv_query_shapes() {
        assert_eq!(arxiv_query(""), "cat:cs.*");
        assert_eq!(arxiv_query("llm"), "(abs:llm OR ti:llm OR all:llm)");
        assert_eq!(
            arxiv_query("a b|c"),
            "((abs:a OR ti:a OR all:a) AND (abs:b OR ti:b OR all:b)) AND (abs:c OR ti:c OR all:c)"
        );
        assert_eq!(arxiv_query("x\" OR (all:y)"), "((abs:x OR ti:x OR all:x) AND (abs:OR OR ti:OR OR all:OR) AND (abs:ally OR ti:ally OR all:ally))");
    }

    #[test]
    fn parses_atom() {
        let xml = r#"<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:arxiv="http://arxiv.org/schemas/atom">
        <entry><id>http://arxiv.org/abs/1</id><published>2026-01-01T00:00:00Z</published>
        <title>A  Title
        wrapped</title><summary> Some
          abstract. </summary>
        <author><name>Ann</name></author><author><name>Bob</name></author>
        <link href="http://arxiv.org/abs/1" rel="alternate"/><link title="pdf" href="http://arxiv.org/pdf/1" rel="related"/>
        </entry></feed>"#;
        let p = parse_arxiv(xml).unwrap();
        assert_eq!(p.len(), 1);
        assert_eq!(p[0].title, "A Title wrapped");
        assert_eq!(p[0].summary, "Some abstract.");
        assert_eq!(p[0].authors, vec!["Ann", "Bob"]);
        assert_eq!(p[0].pdf_link.as_deref(), Some("http://arxiv.org/pdf/1"));
    }

    #[test]
    fn arxiv_error_feed_is_an_error() {
        let xml = r#"<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>http://arxiv.org/api/errors#x</id><title>Error</title><summary>bad</summary></entry></feed>"#;
        assert!(parse_arxiv(xml).is_err());
    }
}
