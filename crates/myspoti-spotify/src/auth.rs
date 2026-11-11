//! Spotify Authentication, Session and Client-Token management.

use std::sync::Arc;
use std::time::Duration;
use reqwest::header::{ACCEPT, CONTENT_TYPE, USER_AGENT};
use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use tokio::sync::RwLock;

const DEFAULT_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
const CLIENT_TOKEN_URL: &str = "https://clienttoken.spotify.com/v1/clienttoken";
const DEFAULT_CLIENT_VERSION: &str = "1.2.13.477.ga4363038";
const SPOTIFY_CLIENT_ID: &str = "d8a5ed958d274c2e8ee717e6a4b0971d";
const TOTP_SECRET: &str = ",7/*F(\"rLJ2oxaKL^f+E1xvP@N";
const TOTP_VERSION: &str = "61";

/// Generate the 6-digit TOTP challenge required by Spotify Web Player.
pub fn generate_spotify_totp(now_secs: u64) -> String {
    let mut key = String::with_capacity(64);
    for (i, c) in TOTP_SECRET.bytes().enumerate() {
        let x = c ^ ((i % 33 + 9) as u8);
        key.push_str(&x.to_string());
    }

    let time_step = now_secs / 30;
    let msg = time_step.to_be_bytes();

    let mac = hmac_sha1(key.as_bytes(), &msg);
    let offset = (mac[mac.len() - 1] & 0x0f) as usize;
    let code = (((mac[offset] & 0x7f) as u32) << 24)
        | ((mac[offset + 1] as u32) << 16)
        | ((mac[offset + 2] as u32) << 8)
        | (mac[offset + 3] as u32);

    format!("{:06}", code % 1_000_000)
}

fn hmac_sha1(key: &[u8], msg: &[u8]) -> [u8; 20] {
    let mut k = [0u8; 64];
    if key.len() > 64 {
        let hash = Sha1::digest(key);
        k[..20].copy_from_slice(&hash);
    } else {
        k[..key.len()].copy_from_slice(key);
    }

    let mut i_key_pad = [0x36u8; 64];
    let mut o_key_pad = [0x5cu8; 64];
    for i in 0..64 {
        i_key_pad[i] ^= k[i];
        o_key_pad[i] ^= k[i];
    }

    let mut inner = Sha1::new();
    inner.update(&i_key_pad);
    inner.update(msg);
    let inner_hash = inner.finalize();

    let mut outer = Sha1::new();
    outer.update(&o_key_pad);
    outer.update(&inner_hash);
    outer.finalize().into()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebToken {
    pub access_token: String,
    pub expires_at_ms: u64,
    pub client_id: String,
    pub app_version: String,
    pub is_anonymous: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientToken {
    pub value: String,
    pub expires_at_ms: u64,
}

#[derive(Debug, Clone)]
pub struct TokenPair {
    pub web: WebToken,
    pub client: ClientToken,
}

struct TokenState {
    web: Option<WebToken>,
    client: Option<ClientToken>,
    device_id: String,
    client_version: String,
}

#[derive(Clone)]
pub struct SpotifyAuthManager {
    http: reqwest::Client,
    state: Arc<RwLock<TokenState>>,
    sp_dc: Arc<RwLock<Option<String>>>,
}

impl SpotifyAuthManager {
    pub fn new() -> Self {
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(15))
            .build()
            .expect("failed to build reqwest client");

        let device_id = uuid::Uuid::new_v4().to_string();
        let env_sp_dc = std::env::var("SP_DC").ok().filter(|s| !s.is_empty());

        Self {
            http,
            state: Arc::new(RwLock::new(TokenState {
                web: None,
                client: None,
                device_id,
                client_version: DEFAULT_CLIENT_VERSION.to_string(),
            })),
            sp_dc: Arc::new(RwLock::new(env_sp_dc)),
        }
    }

    pub async fn has_session(&self) -> bool {
        let cookie = self.sp_dc.read().await;
        cookie.is_some()
    }

    pub async fn set_sp_dc(&self, sp_dc: String) {
        let mut cookie = self.sp_dc.write().await;
        *cookie = Some(sp_dc);
        let mut state = self.state.write().await;
        state.web = None;
    }

    pub async fn clear_session(&self) {
        let mut cookie = self.sp_dc.write().await;
        *cookie = None;
        let mut state = self.state.write().await;
        state.web = None;
    }

    pub async fn get_tokens(&self) -> Result<TokenPair, Box<dyn std::error::Error + Send + Sync>> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_millis() as u64;

        // Fast path: cached and still valid (> 60s)
        {
            let state = self.state.read().await;
            if let (Some(w), Some(c)) = (&state.web, &state.client) {
                if w.expires_at_ms.saturating_sub(now) > 60_000 && c.expires_at_ms.saturating_sub(now) > 300_000 {
                    return Ok(TokenPair {
                        web: w.clone(),
                        client: c.clone(),
                    });
                }
            }
        }

        // Slow path: refresh tokens
        let mut state = self.state.write().await;

        let web = match &state.web {
            Some(w) if w.expires_at_ms.saturating_sub(now) > 60_000 => w.clone(),
            _ => {
                let fresh = self.fetch_web_token().await?;
                state.web = Some(fresh.clone());
                fresh
            }
        };

        let client = match &state.client {
            Some(c) if c.expires_at_ms.saturating_sub(now) > 300_000 => c.clone(),
            _ => {
                let fresh = self.mint_client_token(&web, &state.device_id, &state.client_version).await?;
                state.client = Some(fresh.clone());
                fresh
            }
        };

        Ok(TokenPair { web, client })
    }

    async fn fetch_web_token(&self) -> Result<WebToken, Box<dyn std::error::Error + Send + Sync>> {
        let sp_dc = self.sp_dc.read().await;
        let cookie = sp_dc.as_ref().ok_or("Spotify session cookie (sp_dc) is not configured")?;

        let now_secs = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_secs();
        let totp = generate_spotify_totp(now_secs);

        let url = format!(
            "https://open.spotify.com/api/token?reason=init&productType=web-player&totp={}&totpServer={}&totpVer={}",
            totp, totp, TOTP_VERSION
        );

        let resp = self.http
            .get(&url)
            .header(USER_AGENT, DEFAULT_USER_AGENT)
            .header(ACCEPT, "application/json")
            .header("cookie", format!("sp_dc={}", cookie))
            .send()
            .await?
            .error_for_status()?;
        let json: serde_json::Value = resp.json().await?;

        let access_token = json["accessToken"]
            .as_str()
            .ok_or("missing accessToken in /api/token response")?
            .to_string();

        let expires_at_ms = json["accessTokenExpirationTimestampMs"]
            .as_u64()
            .unwrap_or(0);

        let client_id = json["clientId"]
            .as_str()
            .unwrap_or(SPOTIFY_CLIENT_ID)
            .to_string();

        let is_anonymous = json["isAnonymous"].as_bool().unwrap_or(false);

        Ok(WebToken {
            access_token,
            expires_at_ms,
            client_id,
            app_version: DEFAULT_CLIENT_VERSION.to_string(),
            is_anonymous,
        })
    }

    async fn mint_client_token(
        &self,
        web: &WebToken,
        device_id: &str,
        client_version: &str,
    ) -> Result<ClientToken, Box<dyn std::error::Error + Send + Sync>> {
        let body = serde_json::json!({
            "client_data": {
                "client_version": client_version,
                "client_id": web.client_id,
                "js_sdk_data": {
                    "device_brand": "unknown",
                    "device_model": "unknown",
                    "os": "linux",
                    "os_version": "unknown",
                    "device_id": device_id,
                    "device_type": "computer"
                }
            }
        });

        let resp = self.http
            .post(CLIENT_TOKEN_URL)
            .header(USER_AGENT, DEFAULT_USER_AGENT)
            .header(CONTENT_TYPE, "application/json")
            .header(ACCEPT, "application/json")
            .json(&body)
            .send()
            .await?
            .error_for_status()?;

        let json: serde_json::Value = resp.json().await?;
        let granted = &json["granted_token"];

        let value = granted["token"]
            .as_str()
            .ok_or("missing granted_token.token from clienttoken response")?
            .to_string();

        let expires_after_seconds = granted["expires_after_seconds"].as_u64().unwrap_or(1209600);
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_millis() as u64;

        Ok(ClientToken {
            value,
            expires_at_ms: now + (expires_after_seconds * 1000),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spotify_totp_generation() {
        let code = generate_spotify_totp(1731310000);
        assert_eq!(code, "046224");
    }
}
