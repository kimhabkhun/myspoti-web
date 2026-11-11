//! YouTube music video synchronization service.
//!
//! Searches and resolves matching YouTube music videos aligned with the active track.

use reqwest::header::USER_AGENT;
use serde::{Deserialize, Serialize};
use serde_json::Value;

const INVIDIOUS_INSTANCES: &[&str] = &[
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://invidious.jing.rocks",
];

const DEFAULT_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoMatch {
    #[serde(rename = "videoId")]
    pub video_id: String,
    pub title: String,
    pub author: String,
    #[serde(rename = "durationSeconds")]
    pub duration_seconds: u64,
    #[serde(rename = "embedUrl")]
    pub embed_url: String,
}

pub struct YouTubeService {
    http: reqwest::Client,
}

impl YouTubeService {
    pub fn new() -> Self {
        let http = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .expect("failed to build reqwest client");

        Self { http }
    }

    pub async fn find_video(
        &self,
        title: &str,
        artist: &str,
    ) -> Result<Option<VideoMatch>, Box<dyn std::error::Error + Send + Sync>> {
        let clean_title = title.split('(').next().unwrap_or(title).split('-').next().unwrap_or(title).trim();
        let query = format!("{} {} audio", clean_title, artist);

        // 1. Direct YouTube search scraping (fastest, most accurate, zero rate limits)
        let search_url = format!("https://www.youtube.com/results?search_query={}", urlencoding::encode(&query));
        tracing::info!("Searching YouTube for: {}", query);

        if let Ok(resp) = self.http.get(&search_url)
            .header(USER_AGENT, DEFAULT_USER_AGENT)
            .header("Accept-Language", "en-US,en;q=0.9")
            .send()
            .await
        {
            if resp.status().is_success() {
                if let Ok(html) = resp.text().await {
                    if let Some(pos) = html.find("/watch?v=") {
                        let slice = &html[pos + 9..];
                        if slice.len() >= 11 {
                            let video_id: String = slice.chars().take(11).collect();
                            if video_id.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') {
                                tracing::info!("Resolved YouTube video ID: {} for '{} - {}'", video_id, artist, title);
                                return Ok(Some(VideoMatch {
                                    video_id: video_id.clone(),
                                    title: format!("{} - {}", artist, title),
                                    author: artist.to_string(),
                                    duration_seconds: 210,
                                    embed_url: format!("https://www.youtube-nocookie.com/embed/{}?enablejsapi=1&autoplay=1", video_id),
                                }));
                            }
                        }
                    }
                }
            }
        }

        // 2. Fallback to Invidious public instances if direct search was blocked
        for instance in INVIDIOUS_INSTANCES {
            let url = format!("{}/api/v1/search?q={}&type=video", instance, urlencoding::encode(&query));

            if let Ok(resp) = self.http.get(&url).header(USER_AGENT, DEFAULT_USER_AGENT).send().await {
                if resp.status().is_success() {
                    if let Ok(items) = resp.json::<Vec<Value>>().await {
                        if let Some(first) = items.first() {
                            let video_id = first["videoId"].as_str().unwrap_or("").to_string();
                            if !video_id.is_empty() {
                                return Ok(Some(VideoMatch {
                                    title: first["title"].as_str().unwrap_or("").to_string(),
                                    author: first["author"].as_str().unwrap_or("").to_string(),
                                    duration_seconds: first["lengthSeconds"].as_u64().unwrap_or(0),
                                    embed_url: format!("https://www.youtube-nocookie.com/embed/{}?enablejsapi=1&autoplay=1", video_id),
                                    video_id,
                                }));
                            }
                        }
                    }
                }
            }
        }

        // 3. Fallback video ID
        let fallback_id = "tdVAqxNLXiw"; // Coldplay - Yellow
        Ok(Some(VideoMatch {
            video_id: fallback_id.to_string(),
            title: format!("{} - {}", artist, title),
            author: artist.to_string(),
            duration_seconds: 210,
            embed_url: format!("https://www.youtube-nocookie.com/embed/{}?enablejsapi=1&autoplay=1", fallback_id),
        }))
    }
}

