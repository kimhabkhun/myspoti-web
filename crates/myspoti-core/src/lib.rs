//! Core domain models and entities for Myspoti.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ItemKind {
    #[serde(rename = "track")]
    Track,
    #[serde(rename = "episode")]
    Episode,
    #[serde(rename = "ad")]
    Ad,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackItem {
    pub kind: ItemKind,
    pub uri: String,
    pub uid: Option<String>,
    pub name: String,
    pub advertiser: Option<String>,
    #[serde(rename = "durationMs")]
    pub duration_ms: Option<u64>,
    pub artists: Vec<ArtistRef>,
    pub album: Option<AlbumRef>,
    pub image: Option<String>,
    pub explicit: bool,
    #[serde(rename = "mediaType")]
    pub media_type: Option<String>,
    pub provider: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ArtistRef {
    pub uri: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AlbumRef {
    pub uri: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaybackState {
    pub track: Option<TrackItem>,
    #[serde(rename = "contextUri")]
    pub context_uri: Option<String>,
    #[serde(rename = "contextName")]
    pub context_name: Option<String>,
    #[serde(rename = "isPaused")]
    pub is_paused: bool,
    #[serde(rename = "isBuffering")]
    pub is_buffering: bool,
    #[serde(rename = "positionMs")]
    pub position_ms: u64,
    pub timestamp: u64,
    #[serde(rename = "durationMs")]
    pub duration_ms: u64,
    pub shuffle: bool,
    pub repeat: u8, // 0 = off, 1 = context, 2 = track
    pub speed: f32,
    pub restrictions: serde_json::Value,
    #[serde(rename = "playbackId")]
    pub playback_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LyricWord {
    pub word: String,
    #[serde(rename = "startTimeMs")]
    pub start_time_ms: u64,
    #[serde(rename = "endTimeMs")]
    pub end_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LyricLine {
    pub text: String,
    #[serde(rename = "startTimeMs")]
    pub start_time_ms: u64,
    pub words: Vec<LyricWord>,
    pub translation: Option<String>,
    pub romanized: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Lyrics {
    #[serde(rename = "syncType")]
    pub sync_type: String, // "LINE_SYNCED", "SYLLABLE_SYNCED", "UNSYNCED"
    pub lines: Vec<LyricLine>,
    pub provider: String,
    pub copyright: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeniusAnnotation {
    pub fragment: String,
    pub explanation: String,
    pub votes: i32,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeniusMeaning {
    pub url: String,
    pub title: String,
    pub artist: String,
    pub about: Option<String>,
    pub notes: Vec<GeniusAnnotation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RadioStation {
    #[serde(rename = "stationUuid")]
    pub station_uuid: String,
    pub name: String,
    #[serde(rename = "streamUrl")]
    pub stream_url: String,
    pub homepage: String,
    pub favicon: String,
    pub tags: Vec<String>,
    pub country: String,
    #[serde(rename = "countryCode")]
    pub country_code: String,
    pub codec: String,
    #[serde(rename = "bitrateKbps")]
    pub bitrate_kbps: i32,
    pub votes: i32,
}

