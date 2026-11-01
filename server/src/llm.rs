//! Abstract simplification through OpenRouter.

use moka::future::Cache;
use reqwest::Client;
use serde_json::{json, Value};
use std::{
    collections::hash_map::DefaultHasher,
    hash::{Hash, Hasher},
    sync::Arc,
    time::Duration,
};
use tokio::sync::Semaphore;

const OPENROUTER_URL: &str = "https://openrouter.ai/api/v1/chat/completions";

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Persona {
    Default,
    College,
    Professional,
    Kids,
    Researcher,
    Executive,
    Visual,
}

impl Persona {
    pub fn parse(s: &str) -> Persona {
        match s {
            "college" => Persona::College,
            "professional" => Persona::Professional,
            "kids" => Persona::Kids,
            "researcher" => Persona::Researcher,
            "executive" => Persona::Executive,
            "visual" => Persona::Visual,
            _ => Persona::Default,
        }
    }

    fn prompt(self) -> &'static str {
        match self {
            Persona::College => "Rewrite this academic paper abstract for a college student in that field of study. Use appropriate terminology but explain complex concepts clearly.",
            Persona::Professional => "Rewrite this academic paper abstract for a professional software engineer. Use technical terminology and focus on implementation details and methodologies. Highlight potential on implication on building tech products or services, if any.",
            Persona::Kids => "Rewrite this academic paper abstract for children under 10 years old. Use very simple language, fun analogies, and avoid all technical terms. Make it engaging and relatable to a child's everyday experiences.",
            Persona::Researcher => "Rewrite this academic paper abstract for a researcher in an adjacent field. Maintain technical rigor but provide additional context for field-specific terminology. Focus on methodological insights and potential cross-disciplinary applications.",
            Persona::Executive => "Rewrite this academic paper abstract for a executive or decision-maker. Focus on business implications, practical applications, and potential to turn into a business opportunity.",
            Persona::Visual => "Rewrite this academic paper abstract with a focus on visual and spatial explanations. Use descriptive language that creates mental images, spatial relationships, and visual metaphors to explain the concepts.",
            Persona::Default => "Rewrite this academic paper abstract in plain English that is easy to understand for layman. Keep the main points and findings, but make it more accessible to an average person without any background in the field.",
        }
    }
}

pub struct Llm {
    http: Client,
    key: String,
    model: String,
    effort: String,
    cache: Cache<(Persona, u64), String>,
    gate: Semaphore,
}

impl Llm {
    pub fn new(http: Client, key: String, model: String, effort: String) -> Arc<Self> {
        Arc::new(Llm {
            http,
            key,
            model,
            effort,
            cache: Cache::builder().max_capacity(5_000).time_to_live(Duration::from_secs(7 * 24 * 3600)).build(),
            // Bounds both memory and spend if someone hammers the endpoint.
            gate: Semaphore::new(8),
        })
    }

    /// Rewrite `abstract_` for `persona`. Any failure returns the original text.
    pub async fn simplify(&self, abstract_: &str, persona: Persona) -> String {
        if abstract_.trim().is_empty() {
            return abstract_.to_string();
        }
        let mut h = DefaultHasher::new();
        abstract_.hash(&mut h);
        match self.cache.try_get_with((persona, h.finish()), self.call(abstract_, persona)).await {
            Ok(s) => s,
            Err(e) => {
                eprintln!("llm: {e}");
                abstract_.to_string()
            }
        }
    }

    async fn call(&self, abstract_: &str, persona: Persona) -> Result<String, String> {
        let _permit = self.gate.acquire().await.map_err(|e| e.to_string())?;
        let prompt = format!(
            "You are given an academic paper abstract:\n\n<abstract>\n{abstract_}\n</abstract>\n\n{}\nReply directly with the content, do not include preamble like \"Here is the simplified abstract\" or anything else.\n\nUse 200 word or less.\n",
            persona.prompt()
        );
        let resp = self
            .http
            .post(OPENROUTER_URL)
            .timeout(Duration::from_secs(90))
            .bearer_auth(&self.key)
            .header("X-Title", "ArxivTok")
            .json(&json!({
                "model": self.model,
                "reasoning": { "effort": self.effort },
                // Reasoning tokens count against this; it bounds the worst-case cost of one call.
                "max_completion_tokens": 6000,
                "messages": [{ "role": "user", "content": prompt }],
            }))
            .send()
            .await
            .map_err(|e| e.to_string())?;
        let status = resp.status();
        let body: Value = resp.json().await.map_err(|e| format!("bad response ({status}): {e}"))?;
        if !status.is_success() {
            return Err(format!("openrouter {status}: {body}"));
        }
        body["choices"][0]["message"]["content"]
            .as_str()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .ok_or_else(|| "empty completion".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unknown_persona_is_default() {
        assert_eq!(Persona::parse("nope"), Persona::Default);
        assert_eq!(Persona::parse("kids"), Persona::Kids);
    }
}
