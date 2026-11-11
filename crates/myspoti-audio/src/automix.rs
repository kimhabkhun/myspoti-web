//! AutoMix DJ-style beat alignment, crossfade curves, and segue planning.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TransitionStyle {
    BeatBlend,  // Beat-matched overlap with tempo alignment
    CutOnBeat,  // Hard cut precisely on downbeat
    SmoothFade, // Classic equal-power volume fade
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BeatGrid {
    pub bpm: f32,
    pub first_beat_ms: u64,
    pub beat_interval_ms: f32,
}

impl BeatGrid {
    pub fn new(bpm: f32, first_beat_ms: u64) -> Self {
        let beat_interval_ms = if bpm > 0.0 { 60_000.0 / bpm } else { 500.0 };
        Self {
            bpm,
            first_beat_ms,
            beat_interval_ms,
        }
    }

    /// Finds the nearest downbeat timestamp (ms) to a target position
    pub fn nearest_beat_ms(&self, target_ms: u64) -> u64 {
        if target_ms < self.first_beat_ms {
            return self.first_beat_ms;
        }
        let elapsed = (target_ms - self.first_beat_ms) as f32;
        let beat_count = (elapsed / self.beat_interval_ms).round();
        self.first_beat_ms + (beat_count * self.beat_interval_ms) as u64
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeguePlan {
    pub style: TransitionStyle,
    pub start_ms_outgoing: u64,
    pub start_ms_incoming: u64,
    pub duration_ms: u64,
    pub target_tempo_ratio: f32,
}

pub struct MixPlanner;

impl MixPlanner {
    /// Plans a transition between outgoing Track A and incoming Track B
    pub fn plan_transition(
        grid_a: Option<&BeatGrid>,
        grid_b: Option<&BeatGrid>,
        track_a_duration_ms: u64,
        style: TransitionStyle,
    ) -> SeguePlan {
        match (grid_a, grid_b, style) {
            (Some(a), Some(b), TransitionStyle::BeatBlend) => {
                // Align to 4 bars (16 beats) before end of track A
                let blend_beats = 16.0;
                let duration_ms = (blend_beats * a.beat_interval_ms) as u64;
                let start_ms_outgoing = track_a_duration_ms.saturating_sub(duration_ms + 1000);
                let aligned_start = a.nearest_beat_ms(start_ms_outgoing);

                let tempo_ratio = if a.bpm > 0.0 && b.bpm > 0.0 {
                    b.bpm / a.bpm
                } else {
                    1.0
                };

                SeguePlan {
                    style: TransitionStyle::BeatBlend,
                    start_ms_outgoing: aligned_start,
                    start_ms_incoming: b.first_beat_ms,
                    duration_ms,
                    target_tempo_ratio: tempo_ratio,
                }
            }
            (Some(a), Some(b), TransitionStyle::CutOnBeat) => {
                let cut_point = a.nearest_beat_ms(track_a_duration_ms.saturating_sub(1000));
                SeguePlan {
                    style: TransitionStyle::CutOnBeat,
                    start_ms_outgoing: cut_point,
                    start_ms_incoming: b.first_beat_ms,
                    duration_ms: 10, // Instantaneous cut
                    target_tempo_ratio: 1.0,
                }
            }
            _ => {
                // Default smooth fade (5 seconds)
                let duration_ms = 5000;
                let start_ms_outgoing = track_a_duration_ms.saturating_sub(duration_ms);
                SeguePlan {
                    style: TransitionStyle::SmoothFade,
                    start_ms_outgoing,
                    start_ms_incoming: 0,
                    duration_ms,
                    target_tempo_ratio: 1.0,
                }
            }
        }
    }

    /// Computes equal-power crossfade gain for (outgoing, incoming) at normalized progress t in [0.0, 1.0]
    #[inline]
    pub fn equal_power_gains(t: f32) -> (f32, f32) {
        use std::f32::consts::FRAC_PI_2;
        let t_clamped = t.clamp(0.0, 1.0);
        let gain_outgoing = (FRAC_PI_2 * (1.0 - t_clamped)).sin();
        let gain_incoming = (FRAC_PI_2 * t_clamped).sin();
        (gain_outgoing, gain_incoming)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_equal_power_crossfade_invariance() {
        // Equal power curve property: gain_out^2 + gain_in^2 ≈ 1.0
        for i in 0..=10 {
            let t = i as f32 / 10.0;
            let (out_g, in_g) = MixPlanner::equal_power_gains(t);
            let power = out_g * out_g + in_g * in_g;
            assert!((power - 1.0).abs() < 1e-4, "Power at t={} was {}", t, power);
        }
    }

    #[test]
    fn test_nearest_downbeat_alignment() {
        let grid = BeatGrid::new(120.0, 1000); // 120 bpm -> 500ms intervals
        assert_eq!(grid.nearest_beat_ms(1000), 1000);
        assert_eq!(grid.nearest_beat_ms(1240), 1000);
        assert_eq!(grid.nearest_beat_ms(1260), 1500);
        assert_eq!(grid.nearest_beat_ms(1900), 2000);
    }

    #[test]
    fn test_plan_transition_beat_blend() {
        let grid_a = BeatGrid::new(120.0, 1000);
        let grid_b = BeatGrid::new(124.0, 500);
        let plan = MixPlanner::plan_transition(Some(&grid_a), Some(&grid_b), 180_000, TransitionStyle::BeatBlend);

        assert_eq!(plan.style, TransitionStyle::BeatBlend);
        assert!(plan.start_ms_outgoing < 180_000);
        assert_eq!(plan.start_ms_incoming, 500);
        assert!(plan.duration_ms > 0);
        assert!((plan.target_tempo_ratio - (124.0 / 120.0)).abs() < 1e-3);
    }
}

