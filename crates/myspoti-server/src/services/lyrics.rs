//! Unified Lyrics Resolver supporting Spotify ColorLyrics and LRCLIB fallback.

use myspoti_core::{LyricLine, Lyrics};
use myspoti_spotify::Spclient;
use reqwest::header::USER_AGENT;
use serde_json::Value;

const LRCLIB_URL: &str = "https://lrclib.net/api/get";
const DEFAULT_USER_AGENT: &str = "Myspoti-Rust-Web (https://github.com/myspoti)";

pub struct LyricsResolver {
    http: reqwest::Client,
    spclient: Spclient,
}

impl LyricsResolver {
    pub fn new(spclient: Spclient) -> Self {
        let http = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(8))
            .build()
            .expect("failed to build reqwest client");

        Self { http, spclient }
    }

    pub async fn resolve_lyrics(
        &self,
        track_id: &str,
        title: &str,
        artist: &str,
    ) -> Result<Lyrics, Box<dyn std::error::Error + Send + Sync>> {
        // 1. Try Spotify ColorLyrics first (rich word-by-word timing)
        if !track_id.is_empty() {
            if let Ok(lyrics) = self.spclient.get_color_lyrics(track_id).await {
                if !lyrics.lines.is_empty() {
                    return Ok(lyrics);
                }
            }
        }

        // 2. Fallback to LRCLIB (line-synced or plain)
        let query_url = format!("{LRCLIB_URL}?track_name={}&artist_name={}", urlencoding::encode(title), urlencoding::encode(artist));
        let resp = self.http.get(&query_url)
            .header(USER_AGENT, DEFAULT_USER_AGENT)
            .send()
            .await?;

        if resp.status().is_success() {
            let json: Value = resp.json().await?;
            if let Some(synced) = json["syncedLyrics"].as_str() {
                let lines = parse_lrc(synced);
                return Ok(Lyrics {
                    sync_type: "LINE_SYNCED".to_string(),
                    lines,
                    provider: "LRCLIB".to_string(),
                    copyright: None,
                });
            } else if let Some(plain) = json["plainLyrics"].as_str() {
                let lines = plain.lines().map(|l| LyricLine {
                    text: l.to_string(),
                    start_time_ms: 0,
                    words: vec![],
                    translation: None,
                    romanized: None,
                }).collect();

                return Ok(Lyrics {
                    sync_type: "UNSYNCED".to_string(),
                    lines,
                    provider: "LRCLIB".to_string(),
                    copyright: None,
                });
            }
        }

        Err("No lyrics found across all providers".into())
    }
}

fn parse_lrc(lrc: &str) -> Vec<LyricLine> {
    let mut lines = Vec::new();
    for line in lrc.lines() {
        if line.starts_with('[') && line.len() > 10 && line.chars().nth(3) == Some(':') {
            let min: u64 = line[1..3].parse().unwrap_or(0);
            let sec: u64 = line[4..6].parse().unwrap_or(0);
            let ms: u64 = line[7..9].parse().unwrap_or(0) * 10;
            let start_time_ms = (min * 60 * 1000) + (sec * 1000) + ms;
            let text = line[10..].trim().to_string();

            lines.push(LyricLine {
                text,
                start_time_ms,
                words: vec![],
                translation: None,
                romanized: None,
            });
        }
    }
    lines
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_lrc() {
        let sample_lrc = "[00:12.34]First line of lyrics\n[00:15.80]Second line of lyrics\n";
        let lines = parse_lrc(sample_lrc);

        assert_eq!(lines.len(), 2);
        assert_eq!(lines[0].text, "First line of lyrics");
        assert_eq!(lines[0].start_time_ms, 12340);
        assert_eq!(lines[1].text, "Second line of lyrics");
        assert_eq!(lines[1].start_time_ms, 15800);
    }
}
