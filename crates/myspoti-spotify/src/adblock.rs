//! Ad-blocking and playback state machine rewriter.
//!
//! Replaces Spotify's ad transitions so free accounts do not experience audio ad breaks.

use serde_json::Value;

pub const BLOCKED_HOSTS: &[&str] = &[
    "adstudio-assets.scdn.co",
    "video-fa.scdn.co",
    "audio-fa.scdn.co",
];

pub struct AdBlock;

impl AdBlock {
    pub fn is_blocked_url(url: &str) -> bool {
        BLOCKED_HOSTS.iter().any(|host| url.contains(host))
    }

    /// Rewrites playback state JSON from `PUT track-playback/v1/devices/{device}/state`.
    ///
    /// If the `advance` transition of a track points to an ad state, we point it directly
    /// to where `skip_next` would go (the next track).
    pub fn rewrite_playback_state(state: &mut Value) -> bool {
        let mut modified = false;

        if let Some(state_machine) = state.get_mut("state_machine") {
            if let Some(states) = state_machine.get_mut("states").and_then(|s| s.as_array_mut()) {
                for s in states {
                    let is_ad = s.get("metadata")
                        .and_then(|m| m.get("is_advertisement"))
                        .and_then(|v| v.as_str().or_else(|| v.as_bool().map(|b| if b { "true" } else { "false" })))
                        .map(|v| v == "true")
                        .unwrap_or(false);

                    if !is_ad {
                        if let Some(transitions) = s.get_mut("transitions") {
                            let advance_target = transitions.get("advance").and_then(|v| v.as_str()).map(|s| s.to_string());
                            let skip_next_target = transitions.get("skip_next").and_then(|v| v.as_str()).map(|s| s.to_string());

                            if let (Some(adv), Some(skip)) = (advance_target, skip_next_target) {
                                if adv != skip {
                                    // Point advance to skip_next to bypass the ad
                                    transitions["advance"] = Value::String(skip);
                                    modified = true;
                                }
                            }
                        }
                    }
                }
            }
        }

        modified
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_ad_host_filtering() {
        assert!(AdBlock::is_blocked_url("https://adstudio-assets.scdn.co/mp3/test.mp3"));
        assert!(AdBlock::is_blocked_url("https://video-fa.scdn.co/stream.mp4"));
        assert!(!AdBlock::is_blocked_url("https://audio-ak-spotify-com.akamaized.net/track.mp4"));
        assert!(!AdBlock::is_blocked_url("https://open.spotify.com/api/token"));
    }

    #[test]
    fn test_rewrite_ad_state_transitions() {
        let mut state = json!({
            "state_machine": {
                "states": [
                    {
                        "metadata": {
                            "is_advertisement": "false"
                        },
                        "transitions": {
                            "advance": "state_ad_break",
                            "skip_next": "state_song_2"
                        }
                    },
                    {
                        "metadata": {
                            "is_advertisement": "true"
                        },
                        "transitions": {}
                    }
                ]
            }
        });

        let modified = AdBlock::rewrite_playback_state(&mut state);
        assert!(modified);

        // Advance transition must now point directly to state_song_2 instead of state_ad_break
        let advance = state["state_machine"]["states"][0]["transitions"]["advance"].as_str().unwrap();
        assert_eq!(advance, "state_song_2");
    }
}

