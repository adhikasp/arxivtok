mod llm;
mod model;
mod sources;

use axum::{
    extract::{Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use futures::future::join_all;
use llm::{Llm, Persona};
use reqwest::Client;
use serde::Deserialize;
use serde_json::json;
use std::{env, sync::Arc, time::Duration};
use tower_http::services::{ServeDir, ServeFile};

#[derive(Clone)]
struct AppState {
    http: Client,
    llm: Option<Arc<Llm>>,
}

/// Everything arrives as a string and is parsed leniently, like the original `Number(x) || default`.
#[derive(Deserialize)]
struct Params {
    page: Option<String>,
    #[serde(rename = "perPage")]
    per_page: Option<String>,
    q: Option<String>,
    source: Option<String>,
    persona: Option<String>,
}

async fn papers(State(st): State<AppState>, Query(p): Query<Params>) -> Response {
    let num = |s: &Option<String>, default: u32| s.as_deref().and_then(|s| s.parse::<u32>().ok()).filter(|n| *n > 0).unwrap_or(default);
    let page = p.page.as_deref().and_then(|s| s.parse::<u32>().ok()).unwrap_or(0).min(1_000);
    let per_page = num(&p.per_page, 10).min(20);
    let q: String = p.q.unwrap_or_default().chars().take(200).collect();
    let source = p.source.unwrap_or_else(|| "arxiv".into());
    let persona = Persona::parse(p.persona.as_deref().unwrap_or("default"));

    let mut papers = match sources::fetch(&st.http, &source, &q, page, per_page).await {
        Ok(v) => v,
        Err(e) => {
            eprintln!("fetch {source}: {e}");
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Failed to fetch papers" }))).into_response();
        }
    };
    if let Some(llm) = &st.llm {
        let simplified = join_all(papers.iter().map(|p| llm.simplify(&p.summary, persona))).await;
        for (p, s) in papers.iter_mut().zip(simplified) {
            p.set_summary(s);
        }
    }
    Json(papers).into_response()
}

async fn health() -> impl IntoResponse {
    (
        [(header::CACHE_CONTROL, "no-store")],
        Json(json!({
            "status": "ok",
            "timestamp": chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
            "service": "arxivtok",
        })),
    )
}

async fn shutdown() {
    let mut term = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()).expect("sigterm handler");
    tokio::select! {
        _ = tokio::signal::ctrl_c() => {},
        _ = term.recv() => {},
    }
}

#[tokio::main]
async fn main() {
    let http = Client::builder()
        .timeout(Duration::from_secs(30))
        .user_agent("arxivtok (+https://arxivtok.adhikasp.my.id)")
        .build()
        .expect("http client");
    let llm = env::var("OPENROUTER_API_KEY").ok().filter(|k| !k.is_empty()).map(|key| {
        Llm::new(
            http.clone(),
            key,
            env::var("OPENROUTER_MODEL").unwrap_or_else(|_| "openai/gpt-6-luna".into()),
            env::var("REASONING_EFFORT").unwrap_or_else(|_| "high".into()),
        )
    });
    if llm.is_none() {
        eprintln!("OPENROUTER_API_KEY not set: abstracts will be returned unmodified");
    }

    let mut app = Router::new()
        .route("/api/papers", get(papers))
        .route("/api/health", get(health))
        .with_state(AppState { http, llm });

    // Optional: serve the built frontend directly (local dev / single-binary use).
    // In production Caddy serves the static files and only proxies /api here.
    if let Ok(dir) = env::var("STATIC_DIR") {
        app = app.fallback_service(ServeDir::new(&dir).fallback(ServeFile::new(format!("{dir}/index.html"))));
    }

    let bind = env::var("BIND").unwrap_or_else(|_| "127.0.0.1:3001".into());
    let listener = tokio::net::TcpListener::bind(&bind).await.expect("bind");
    eprintln!("arxivtok listening on {bind}");
    axum::serve(listener, app).with_graceful_shutdown(shutdown()).await.expect("serve");
}
