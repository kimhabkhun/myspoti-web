//! Spclient REST endpoints for lyrics, metadata, and extras.

use reqwest::header::{ACCEPT, AUTHORIZATION, USER_AGENT};
use serde_json::Value;
use crate::auth::SpotifyAuthManager;
use myspoti_core::{LyricLine, LyricWord, Lyrics};

const SPCLIENT_HOST: &str = "https://spclient.wg.spotify.com";
const DEFAULT_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

#[derive(Clone)]
pub struct Spclient {
    http: reqwest::Client,
    auth: SpotifyAuthManager,
}

impl Spclient {
    pub fn new(auth: SpotifyAuthManager) -> Self {
        let http = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .expect("failed to build reqwest client");

        Self { http, auth }
    }

    /// Fetches rich color lyrics (word-by-word or line-by-line synced) from Spotify.
    pub async fn get_color_lyrics(&self, track_id: &str) -> Result<Lyrics, Box<dyn std::error::Error + Send + Sync>> {
        let tokens = self.auth.get_tokens().await?;
        let url = format!("{}/color-lyrics/v2/track/{}?format=json&market=from_token", SPCLIENT_HOST, track_id);

        let resp = self.http
            .get(&url)
            .header(AUTHORIZATION, format!("Bearer {}", tokens.web.access_token))
            .header("client-token", tokens.client.value)
            .header("app-platform", "WebPlayer")
            .header(USER_AGENT, DEFAULT_USER_AGENT)
            .header(ACCEPT, "application/json")
            .send()
            .await?
            .error_for_status()?;

        let json: Value = resp.json().await?;
        let lyrics_obj = &json["lyrics"];

        let sync_type = lyrics_obj["syncType"].as_str().unwrap_or("UNSYNCED").to_string();
        let provider = lyrics_obj["provider"].as_str().unwrap_or("Spotify").to_string();

        let mut lines = Vec::new();
        if let Some(raw_lines) = lyrics_obj["lines"].as_array() {
            for rl in raw_lines {
                let start_time_ms = rl["startTimeMs"].as_str().and_then(|s| s.parse::<u64>().ok()).unwrap_or(0);
                let text = rl["words"].as_str().unwrap_or("").to_string();

                let mut words = Vec::new();
                if let Some(syllables) = rl["syllables"].as_array() {
                    for s in syllables {
                        let word_text = s["text"].as_str().unwrap_or("").to_string();
                        let w_start = s["startTimeMs"].as_str().and_then(|t| t.parse::<u64>().ok()).unwrap_or(start_time_ms);
                        let w_end = s["endTimeMs"].as_str().and_then(|t| t.parse::<u64>().ok()).unwrap_or(w_start + 300);
                        words.push(LyricWord {
                            word: word_text,
                            start_time_ms: w_start,
                            end_time_ms: w_end,
                        });
                    }
                }

                lines.push(LyricLine {
                    text,
                    start_time_ms,
                    words,
                    translation: None,
                    romanized: None,
                });
            }
        }

        Ok(Lyrics {
            sync_type,
            lines,
            provider,
            copyright: None,
        })
    }
}
