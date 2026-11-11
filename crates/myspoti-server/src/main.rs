//! Myspoti Rust Server: High-performance API, reverse proxy, and responsive web host.

use std::{net::SocketAddr, sync::Arc};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use tower_http::{
    compression::CompressionLayer,
    cors::CorsLayer,
    services::ServeDir,
    trace::TraceLayer,
};

mod services;
mod ws;

use myspoti_spotify::{AdBlock, GqlClient, Spclient, SpotifyAuthManager};
use services::{GeniusService, LyricsResolver, RadioService, YouTubeService};
use ws::{ws_handler, WebSocketHub};

#[derive(Clone)]
pub struct AppState {
    pub auth: SpotifyAuthManager,
    pub gql: GqlClient,
    pub spclient: Spclient,
    pub lyrics: Arc<LyricsResolver>,
    pub genius: Arc<GeniusService>,
    pub radio: Arc<RadioService>,
    pub youtube: Arc<YouTubeService>,
    pub ws_hub: WebSocketHub,
}

#[derive(Deserialize)]
pub struct SetSessionRequest {
    pub sp_dc: String,
}

#[derive(Deserialize)]
pub struct SearchParams {
    pub q: String,
}

#[derive(Deserialize)]
pub struct LyricsParams {
    pub title: Option<String>,
    pub artist: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    // Load GraphQL hashes bundled in config/gql-ops.json
    let ops_json = std::fs::read_to_string("config/gql-ops.json")
        .or_else(|_| std::fs::read_to_string("../../config/gql-ops.json"))
        .unwrap_or_else(|_| include_str!("../../../config/gql-ops.json").to_string());

    let auth = SpotifyAuthManager::new();
    // Load persisted session from config/session.json if available
    if let Ok(sess_str) = std::fs::read_to_string("config/session.json") {
        if let Ok(v) = serde_json::from_str::<Value>(&sess_str) {
            if let Some(cookie) = v.get("sp_dc").and_then(|s| s.as_str()) {
                if !cookie.trim().is_empty() {
                    auth.set_sp_dc(cookie.trim().to_string()).await;
                    tracing::info!("Loaded Spotify sp_dc session from config/session.json");
                }
            }
        }
    }
    let gql = GqlClient::new(auth.clone(), &ops_json)
        .expect("failed to initialize Spotify GraphQL client");
    let spclient = Spclient::new(auth.clone());

    let lyrics = Arc::new(LyricsResolver::new(spclient.clone()));
    let genius = Arc::new(GeniusService::new());
    let radio = Arc::new(RadioService::new());
    let youtube = Arc::new(YouTubeService::new());
    let ws_hub = WebSocketHub::new();

    let state = AppState {
        auth,
        gql,
        spclient,
        lyrics,
        genius,
        radio,
        youtube,
        ws_hub,
    };

    let api_router = Router::new()
        .route("/healthz", get(|| async { "OK" }))
        .route("/ws", get(ws_handler))
        .route("/auth/session", get(get_session_handler).post(set_session_handler))
        .route("/auth/tokens", get(get_tokens_handler))
        .route("/home", get(get_home_handler))
        .route("/search", get(search_handler))
        .route("/album/:id", get(get_album_handler))
        .route("/artist/:id", get(get_artist_handler))
        .route("/playlist/:id", get(get_playlist_handler))
        .route("/library", get(get_library_handler))
        .route("/library/liked", get(get_liked_songs_handler))
        .route("/lyrics/:id", get(get_lyrics_handler))
        .route("/genius/meaning", get(get_genius_meaning_handler))
        .route("/radio/stations", get(get_radio_stations_handler))
        .route("/video/sync", get(get_video_sync_handler))
        .route("/playback/adblock/rewrite", post(adblock_rewrite_handler));

    let app = Router::new()
        .nest("/api", api_router)
        .fallback_service(ServeDir::new("web").append_index_html_on_directories(true))
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(CorsLayer::permissive())
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string()).parse::<u16>().unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Myspoti Rust Web listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn map_err(e: Box<dyn std::error::Error + Send + Sync>) -> (StatusCode, String) {
    let msg = e.to_string();
    if msg.contains("sp_dc") || msg.contains("cookie") || msg.contains("401") || msg.contains("Unauthorized") {
        (StatusCode::UNAUTHORIZED, msg)
    } else {
        (StatusCode::INTERNAL_SERVER_ERROR, msg)
    }
}

async fn get_session_handler(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let has_session = state.auth.has_session().await;
    Json(json!({
        "status": "ok",
        "has_session": has_session,
        "connected": has_session
    }))
}

async fn set_session_handler(
    State(state): State<AppState>,
    Json(payload): Json<SetSessionRequest>,
) -> impl IntoResponse {
    let clean = payload.sp_dc.trim().to_string();
    if clean.is_empty() {
        state.auth.clear_session().await;
        let _ = std::fs::remove_file("config/session.json");
        tracing::info!("Cleared Spotify sp_dc session");
        return Json(json!({
            "status": "ok",
            "has_session": false,
            "connected": false,
            "message": "Spotify session cleared"
        }));
    }

    state.auth.set_sp_dc(clean.clone()).await;
    let _ = std::fs::create_dir_all("config");
    let _ = std::fs::write("config/session.json", json!({ "sp_dc": clean }).to_string());
    tracing::info!("Updated and persisted Spotify sp_dc session to config/session.json");

    Json(json!({
        "status": "ok",
        "has_session": true,
        "connected": true,
        "message": "Spotify sp_dc session cookie updated and persisted"
    }))
}

async fn get_tokens_handler(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    match state.auth.get_tokens().await {
        Ok(tokens) => Ok(Json(json!({
            "is_anonymous": tokens.web.is_anonymous,
            "expires_at_ms": tokens.web.expires_at_ms,
            "client_id": tokens.web.client_id,
            "access_token": tokens.web.access_token,
        }))),
        Err(e) => Err(map_err(e)),
    }
}

async fn get_home_handler(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let variables = json!({
        "includeHomeChapterVideoCards": false,
        "homeEndUserIntegration": "INTEGRATION_WEB_PLAYER",
        "timeZone": "Asia/Bangkok",
        "sp_t": "",
        "facet": "",
        "sectionItemsLimit": 10,
        "includeEpisodeContentRatingsV2": true
    });
    match state.gql.query("home", variables).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_err(e)),
    }
}

async fn search_handler(
    State(state): State<AppState>,
    Query(params): Query<SearchParams>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let variables = json!({
        "query": params.q,
        "offset": 0,
        "limit": 20,
        "numberOfTopResults": 5,
        "includeAudiobooks": true
    });
    match state.gql.query("searchTopResultsList", variables).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_err(e)),
    }
}

async fn get_album_handler(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let uri = format!("spotify:album:{}", id);
    let variables = json!({ "uri": uri, "offset": 0, "limit": 100 });
    match state.gql.query("getAlbum", variables).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_err(e)),
    }
}

async fn get_playlist_handler(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let uri = format!("spotify:playlist:{}", id);
    let variables = json!({
        "uri": uri,
        "offset": 0,
        "limit": 100,
        "enableWatchFeedEntrypoint": false,
        "includeEpisodeContentRatingsV2": true
    });
    match state.gql.query("fetchPlaylist", variables).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_err(e)),
    }
}

async fn get_library_handler(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let variables = json!({
        "filters": [],
        "order": null,
        "textFilter": "",
        "features": ["LIKED_SONGS", "YOUR_EPISODES_V2", "PRERELEASES"],
        "limit": 50,
        "offset": 0,
        "flatten": false,
        "expandedFolders": [],
        "folderUri": null,
        "includeFoldersWhenFlattening": true
    });
    match state.gql.query("libraryV3", variables).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_err(e)),
    }
}

async fn get_liked_songs_handler(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let variables = json!({ "offset": 0, "limit": 50 });
    match state.gql.query("fetchLibraryTracks", variables).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

async fn get_artist_handler(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let uri = format!("spotify:artist:{}", id);
    let variables = json!({ "uri": uri, "locale": "en", "includePrerelease": true });
    match state.gql.query("queryArtistOverview", variables).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

async fn get_lyrics_handler(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(params): Query<LyricsParams>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let title = params.title.unwrap_or_default();
    let artist = params.artist.unwrap_or_default();

    match state.lyrics.resolve_lyrics(&id, &title, &artist).await {
        Ok(lyrics) => Ok(Json(json!(lyrics))),
        Err(e) => Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

async fn get_genius_meaning_handler(
    State(state): State<AppState>,
    Query(params): Query<LyricsParams>,
) -> impl IntoResponse {
    let title = params.title.unwrap_or_default();
    let artist = params.artist.unwrap_or_default();

    match state.genius.get_meaning(&title, &artist).await {
        Ok(Some(meaning)) => {
            tracing::info!("Genius found meaning with {} annotations for {} - {}", meaning.notes.len(), title, artist);
            Json(json!({
                "found": true,
                "title": meaning.title,
                "artist": meaning.artist,
                "about": meaning.about,
                "notes": meaning.notes,
                "url": meaning.url,
            }))
        }
        Ok(None) => {
            tracing::info!("Genius: no meaning found for {} - {}", title, artist);
            Json(json!({
                "found": false,
                "title": title,
                "artist": artist,
                "about": null,
                "notes": [],
                "url": null,
            }))
        }
        Err(e) => {
            tracing::warn!("Genius error for {} - {}: {:?}", title, artist, e);
            Json(json!({
                "found": false,
                "title": title,
                "artist": artist,
                "about": null,
                "notes": [],
                "url": null,
            }))
        }
    }
}

async fn get_radio_stations_handler(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    match state.radio.get_top_stations(30).await {
        Ok(stations) => Ok(Json(json!(stations))),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

async fn get_video_sync_handler(
    State(state): State<AppState>,
    Query(params): Query<LyricsParams>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let title = params.title.unwrap_or_default();
    let artist = params.artist.unwrap_or_default();

    match state.youtube.find_video(&title, &artist).await {
        Ok(Some(video)) => Ok(Json(json!(video))),
        Ok(None) => Err((StatusCode::NOT_FOUND, "No matching video found".to_string())),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

async fn adblock_rewrite_handler(
    Json(mut payload): Json<Value>,
) -> impl IntoResponse {
    let rewritten = AdBlock::rewrite_playback_state(&mut payload);
    Json(json!({ "rewritten": rewritten, "state": payload }))
}
