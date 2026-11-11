//! Pathfinder GraphQL client executing persisted queries against Spotify's internal API.

use std::collections::HashMap;
use std::sync::Arc;
use reqwest::header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE, ORIGIN, REFERER, USER_AGENT};
use serde::Deserialize;
use serde_json::{json, Value};
use crate::auth::SpotifyAuthManager;

const PATHFINDER_URL: &str = "https://api-partner.spotify.com/pathfinder/v1/query";
const DEFAULT_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

#[derive(Debug, Clone, Deserialize)]
struct GqlOpsFile {
    operations: HashMap<String, GqlOpEntry>,
}

#[derive(Debug, Clone, Deserialize)]
struct GqlOpEntry {
    hash: String,
}

#[derive(Clone)]
pub struct GqlClient {
    http: reqwest::Client,
    auth: SpotifyAuthManager,
    hashes: Arc<HashMap<String, String>>,
}

impl GqlClient {
    pub fn new(auth: SpotifyAuthManager, ops_json_str: &str) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let file: GqlOpsFile = serde_json::from_str(ops_json_str)?;
        let mut hashes = HashMap::new();
        for (name, entry) in file.operations {
            hashes.insert(name, entry.hash);
        }

        let http = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(15))
            .build()?;

        Ok(Self {
            http,
            auth,
            hashes: Arc::new(hashes),
        })
    }

    pub fn hash_for(&self, op_name: &str) -> Option<&str> {
        self.hashes.get(op_name).map(|s| s.as_str())
    }

    pub async fn query(
        &self,
        operation_name: &str,
        variables: Value,
    ) -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
        let hash = self.hashes.get(operation_name).ok_or_else(|| {
            format!("Unknown GraphQL operation: {}", operation_name)
        })?;

        let tokens = self.auth.get_tokens().await?;

        let payload = json!({
            "operationName": operation_name,
            "variables": variables,
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": hash
                }
            }
        });

        let resp = self.http
            .post(PATHFINDER_URL)
            .header(AUTHORIZATION, format!("Bearer {}", tokens.web.access_token))
            .header("client-token", tokens.client.value)
            .header("app-platform", "WebPlayer")
            .header("spotify-app-version", &tokens.web.app_version)
            .header(ORIGIN, "https://open.spotify.com")
            .header(REFERER, "https://open.spotify.com/")
            .header(USER_AGENT, DEFAULT_USER_AGENT)
            .header(CONTENT_TYPE, "application/json")
            .header(ACCEPT, "application/json")
            .json(&payload)
            .send()
            .await?
            .error_for_status()?;

        let json: Value = resp.json().await?;
        if let Some(errors) = json.get("errors") {
            tracing::warn!("GQL operation {} returned errors: {:?}", operation_name, errors);
        }

        Ok(json.get("data").cloned().unwrap_or(json))
    }
}
