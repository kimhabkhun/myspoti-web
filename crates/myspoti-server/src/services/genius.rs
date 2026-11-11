//! Genius API client for song stories, meanings, and line annotations.

use myspoti_core::{GeniusAnnotation, GeniusMeaning};
use reqwest::header::USER_AGENT;
use serde_json::Value;

const GENIUS_BASE: &str = "https://genius.com/api";
const DEFAULT_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

pub struct GeniusService {
    http: reqwest::Client,
}

impl GeniusService {
    pub fn new() -> Self {
        let http = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(12))
            .http1_only()
            .build()
            .expect("failed to build reqwest client");

        Self { http }
    }

    pub async fn get_meaning(&self, title: &str, artist: &str) -> Result<Option<GeniusMeaning>, Box<dyn std::error::Error + Send + Sync>> {
        let clean_title = title.split('(').next().unwrap_or(title).split('-').next().unwrap_or(title).trim();
        let first_artist = artist.split(',').next().unwrap_or(artist).trim();
        let query = format!("{} {}", clean_title, first_artist);

        let search_url = format!("{}/search/song?per_page=5&q={}", GENIUS_BASE, urlencoding::encode(&query));
        tracing::info!("Genius searching: {}", search_url);

        let resp = self.http.get(&search_url)
            .header(USER_AGENT, DEFAULT_USER_AGENT)
            .header("Accept", "application/json")
            .send()
            .await?;

        let status = resp.status();
        if !status.is_success() {
            tracing::warn!("Genius search returned HTTP status {}", status);
            return Ok(None);
        }

        let json: Value = resp.json().await?;
        let hits = json["response"]["sections"][0]["hits"].as_array();

        let song_hit = match hits.and_then(|h| h.first()) {
            Some(hit) => &hit["result"],
            None => {
                tracing::info!("Genius: no hits found for query '{}'", query);
                return Ok(None);
            }
        };

        let song_id = match song_hit["id"].as_i64() {
            Some(id) => id,
            None => return Ok(None),
        };

        let song_url = song_hit["url"].as_str().unwrap_or("").to_string();
        let song_title = song_hit["title"].as_str().unwrap_or(title).to_string();
        let song_artist = song_hit["artist_names"].as_str().unwrap_or(artist).to_string();

        // 1. Fetch Song Description (About)
        let desc_url = format!("{}/songs/{}?text_format=plain", GENIUS_BASE, song_id);
        let desc_resp = self.http.get(&desc_url)
            .header(USER_AGENT, DEFAULT_USER_AGENT)
            .header("Accept", "application/json")
            .send()
            .await?;

        let desc_json: Value = desc_resp.json().await.unwrap_or_default();
        let about = desc_json["response"]["song"]["description"]["plain"]
            .as_str()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty() && s != "?");

        // 2. Fetch Line Annotations (Referents)
        let referents_url = format!("{}/referents?song_id={}&text_format=plain&per_page=50", GENIUS_BASE, song_id);
        let ref_resp = self.http.get(&referents_url)
            .header(USER_AGENT, DEFAULT_USER_AGENT)
            .header("Accept", "application/json")
            .send()
            .await?;

        let ref_json: Value = ref_resp.json().await.unwrap_or_default();
        let mut notes = Vec::new();

        if let Some(referents) = ref_json["response"]["referents"].as_array() {
            for r in referents {
                let fragment = r["fragment"].as_str().unwrap_or("").trim().to_string();
                if fragment.is_empty() || fragment == "?" {
                    continue;
                }

                // Pick the highest voted annotation
                if let Some(annotations) = r["annotations"].as_array() {
                    let mut best: Option<(String, i32, String)> = None;
                    for a in annotations {
                        let body = a["body"]["plain"].as_str().unwrap_or("").trim().to_string();
                        let votes = a["votes_total"].as_i64().unwrap_or(0) as i32;
                        let url = a["url"].as_str().unwrap_or("").to_string();

                        if !body.is_empty() && body != "?" && votes >= 0 {
                            if best.as_ref().map_or(true, |b| votes > b.1) {
                                best = Some((body, votes, url));
                            }
                        }
                    }

                    if let Some((body, votes, url)) = best {
                        notes.push(GeniusAnnotation {
                            fragment,
                            explanation: body,
                            votes,
                            url: if url.is_empty() { r["url"].as_str().unwrap_or("").to_string() } else { url },
                        });
                    }
                }
            }
        }

        Ok(Some(GeniusMeaning {
            url: song_url,
            title: song_title,
            artist: song_artist,
            about,
            notes,
        }))
    }
}

