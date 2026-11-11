//! High-precision clock for word-by-word karaoke synchronization.

use std::time::Instant;

pub struct LyricClock {
    base_position_ms: u64,
    reference_instant: Instant,
    is_running: bool,
    playback_speed: f32,
}

impl LyricClock {
    pub fn new() -> Self {
        Self {
            base_position_ms: 0,
            reference_instant: Instant::now(),
            is_running: false,
            playback_speed: 1.0,
        }
    }

    pub fn start(&mut self, position_ms: u64) {
        self.base_position_ms = position_ms;
        self.reference_instant = Instant::now();
        self.is_running = true;
    }

    pub fn pause(&mut self) {
        if self.is_running {
            self.base_position_ms = self.current_position_ms();
            self.is_running = false;
        }
    }

    pub fn resume(&mut self) {
        if !self.is_running {
            self.reference_instant = Instant::now();
            self.is_running = true;
        }
    }

    pub fn seek(&mut self, new_position_ms: u64) {
        self.base_position_ms = new_position_ms;
        self.reference_instant = Instant::now();
    }

    pub fn set_speed(&mut self, speed: f32) {
        if speed > 0.1 && speed < 4.0 {
            self.base_position_ms = self.current_position_ms();
            self.reference_instant = Instant::now();
            self.playback_speed = speed;
        }
    }

    #[inline]
    pub fn current_position_ms(&self) -> u64 {
        if !self.is_running {
            return self.base_position_ms;
        }
        let elapsed = self.reference_instant.elapsed().as_secs_f32() * 1000.0 * self.playback_speed;
        self.base_position_ms + elapsed as u64
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clock_start_and_pause() {
        let mut clock = LyricClock::new();
        assert_eq!(clock.current_position_ms(), 0);

        clock.start(5000);
        assert!(clock.current_position_ms() >= 5000);

        clock.pause();
        let paused_at = clock.current_position_ms();
        std::thread::sleep(std::time::Duration::from_millis(50));
        assert_eq!(clock.current_position_ms(), paused_at);
    }
}

