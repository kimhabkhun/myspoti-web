//! Audio DSP algorithms: 10-band parametric biquad equalizer, AutoMix beat transitions, and synchronization.

pub mod automix;
pub mod biquad;
pub mod clock;

pub use automix::{BeatGrid, MixPlanner, SeguePlan, TransitionStyle};
pub use biquad::Equalizer10Band;
pub use clock::LyricClock;
