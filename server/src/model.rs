use serde::Serialize;

pub type Res<T> = Result<T, Box<dyn std::error::Error + Send + Sync>>;

#[derive(Serialize, Clone, Debug)]
pub struct AddictiveSummary {
    pub teaser: String,
    pub full: String,
}

/// Wire format consumed by the frontend (`src/lib/papers.ts`).
#[derive(Serialize, Clone, Debug)]
pub struct Paper {
    pub id: String,
    pub title: String,
    pub summary: String,
    #[serde(rename = "addictiveSummary")]
    pub addictive_summary: AddictiveSummary,
    pub authors: Vec<String>,
    pub published: Option<String>,
    #[serde(rename = "pdfLink")]
    pub pdf_link: Option<String>,
    pub source: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub institution: Option<String>,
}

impl Paper {
    pub fn new(source: &'static str, id: String, title: String, summary: String) -> Self {
        Paper {
            id,
            title,
            addictive_summary: AddictiveSummary {
                teaser: summary.clone(),
                full: summary.clone(),
            },
            summary,
            authors: vec![],
            published: None,
            pdf_link: None,
            source,
            category: None,
            institution: None,
        }
    }

    /// Replace the summary (e.g. after LLM rewriting), keeping the teaser/full copies in sync.
    pub fn set_summary(&mut self, s: String) {
        self.addictive_summary = AddictiveSummary {
            teaser: s.clone(),
            full: s.clone(),
        };
        self.summary = s;
    }
}
