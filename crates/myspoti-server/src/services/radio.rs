//! Radio Browser client for free public Internet live radio streams.

use myspoti_core::RadioStation;
use reqwest::header::USER_AGENT;
use serde_json::Value;

const MIRRORS: &[&str] = &[
    "https://de1.api.radio-browser.info",
    "https://nl1.api.radio-browser.info",
    "https://at1.api.radio-browser.info",
];

const DEFAULT_USER_AGENT: &str = "Myspoti-Rust-Web/1.0";

pub struct RadioService {
    http: reqwest::Client,
}

impl RadioService {
    pub fn new() -> Self {
        let http = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(3))
            .build()
            .expect("failed to build reqwest client");

        Self { http }
    }

    pub async fn get_top_stations(&self, limit: usize) -> Result<Vec<RadioStation>, Box<dyn std::error::Error + Send + Sync>> {
        for mirror in MIRRORS {
            let url = format!("{}/json/stations/topclick/{}", mirror, limit);
            if let Ok(resp) = self.http.get(&url).header(USER_AGENT, DEFAULT_USER_AGENT).send().await {
                if resp.status().is_success() {
                    if let Ok(json) = resp.json::<Vec<Value>>().await {
                        let stations: Vec<RadioStation> = json.into_iter().map(|s| {
                            RadioStation {
                                station_uuid: s["stationuuid"].as_str().unwrap_or("").to_string(),
                                name: s["name"].as_str().unwrap_or("").trim().to_string(),
                                stream_url: s["url_resolved"].as_str().or_else(|| s["url"].as_str()).unwrap_or("").to_string(),
                                homepage: s["homepage"].as_str().unwrap_or("").to_string(),
                                favicon: s["favicon"].as_str().unwrap_or("").to_string(),
                                tags: s["tags"].as_str().unwrap_or("").split(',').map(|t| t.trim().to_string()).filter(|t| !t.is_empty()).collect(),
                                country: s["country"].as_str().unwrap_or("").to_string(),
                                country_code: s["countrycode"].as_str().unwrap_or("").to_string(),
                                codec: s["codec"].as_str().unwrap_or("").to_string(),
                                bitrate_kbps: s["bitrate"].as_i64().unwrap_or(128) as i32,
                                votes: s["votes"].as_i64().unwrap_or(0) as i32,
                            }
                        }).collect();
                        if !stations.is_empty() {
                            return Ok(stations);
                        }
                    }
                }
            }
        }

        // Fallback curated live stations if public mirrors are unreachable
        Ok(vec![
            RadioStation {
                station_uuid: "somafm-groove-salad".into(),
                name: "SomaFM Groove Salad".into(),
                stream_url: "https://ice1.somafm.com/groovesalad-256-mp3".into(),
                homepage: "https://somafm.com".into(),
                favicon: "https://somafm.com/img3/groovesalad-400.jpg".into(),
                tags: vec!["ambient".into(), "chillout".into(), "downtempo".into()],
                country: "United States".into(),
                country_code: "US".into(),
                codec: "MP3".into(),
                bitrate_kbps: 256,
                votes: 9999,
            },
            RadioStation {
                station_uuid: "somafm-def-con".into(),
                name: "SomaFM DEF CON Radio".into(),
                stream_url: "https://ice1.somafm.com/defcon-256-mp3".into(),
                homepage: "https://somafm.com".into(),
                favicon: "https://somafm.com/img3/defcon-400.jpg".into(),
                tags: vec!["electronic".into(), "hacker".into()],
                country: "United States".into(),
                country_code: "US".into(),
                codec: "MP3".into(),
                bitrate_kbps: 256,
                votes: 8500,
            },
            RadioStation {
                station_uuid: "kexp-903-fm".into(),
                name: "KEXP 90.3 FM Seattle".into(),
                stream_url: "https://kexp.streamguys1.com/kexp160.aac".into(),
                homepage: "https://www.kexp.org".into(),
                favicon: "https://www.kexp.org/static/assets/img/icon/icon-192.png".into(),
                tags: vec!["indie".into(), "alternative".into(), "eclectic".into()],
                country: "United States".into(),
                country_code: "US".into(),
                codec: "AAC".into(),
                bitrate_kbps: 160,
                votes: 12000,
            },
            RadioStation {
                station_uuid: "ibiza-global-radio".into(),
                name: "Ibiza Global Radio".into(),
                stream_url: "https://listenssl.ibizaglobalradio.com:8024/stream".into(),
                homepage: "https://ibizaglobalradio.com".into(),
                favicon: "https://ibizaglobalradio.com/favicon.ico".into(),
                tags: vec!["electronic".into(), "dance".into(), "house".into()],
                country: "Spain".into(),
                country_code: "ES".into(),
                codec: "MP3".into(),
                bitrate_kbps: 192,
                votes: 14500,
            },
            RadioStation {
                station_uuid: "swiss-classic".into(),
                name: "Radio Swiss Classic".into(),
                stream_url: "http://stream.srg-ssr.ch/m/rsc_de/mp3_128".into(),
                homepage: "https://www.radioswissclassic.ch".into(),
                favicon: "https://www.radioswissclassic.ch/favicon.ico".into(),
                tags: vec!["classical".into(), "orchestral".into()],
                country: "Switzerland".into(),
                country_code: "CH".into(),
                codec: "MP3".into(),
                bitrate_kbps: 128,
                votes: 7200,
            },
        ])
    }
}

