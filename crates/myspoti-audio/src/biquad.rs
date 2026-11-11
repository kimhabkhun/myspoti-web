//! 10-band Parametric IIR Biquad Equalizer based on the Audio EQ Cookbook by Robert Bristow-Johnson.

use std::f32::consts::PI;

pub const FREQUENCIES: [f32; 10] = [
    31.25, 62.5, 125.0, 250.0, 500.0, 1000.0, 2000.0, 4000.0, 8000.0, 16000.0,
];

#[derive(Debug, Clone, Copy)]
pub struct BiquadFilter {
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,
}

impl BiquadFilter {
    pub fn new() -> Self {
        Self {
            b0: 1.0,
            b1: 0.0,
            b2: 0.0,
            a1: 0.0,
            a2: 0.0,
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
        }
    }

    pub fn set_peaking_eq(&mut self, sample_rate: f32, center_freq: f32, gain_db: f32, q: f32) {
        let a = 10.0f32.powf(gain_db / 40.0);
        let omega = 2.0 * PI * center_freq / sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);

        let b0 = 1.0 + alpha * a;
        let b1 = -2.0 * cos_omega;
        let b2 = 1.0 - alpha * a;
        let a0 = 1.0 + alpha / a;
        let a1 = -2.0 * cos_omega;
        let a2 = 1.0 - alpha / a;

        self.b0 = b0 / a0;
        self.b1 = b1 / a0;
        self.b2 = b2 / a0;
        self.a1 = a1 / a0;
        self.a2 = a2 / a0;
    }

    #[inline]
    pub fn process(&mut self, sample: f32) -> f32 {
        let output = self.b0 * sample + self.b1 * self.x1 + self.b2 * self.x2
            - self.a1 * self.y1 - self.a2 * self.y2;

        self.x2 = self.x1;
        self.x1 = sample;
        self.y2 = self.y1;
        self.y1 = output;

        output
    }

    pub fn reset(&mut self) {
        self.x1 = 0.0;
        self.x2 = 0.0;
        self.y1 = 0.0;
        self.y2 = 0.0;
    }
}

pub struct Equalizer10Band {
    sample_rate: f32,
    filters_l: [BiquadFilter; 10],
    filters_r: [BiquadFilter; 10],
    gains: [f32; 10],
}

impl Equalizer10Band {
    pub fn new(sample_rate: f32) -> Self {
        let mut eq = Self {
            sample_rate,
            filters_l: [BiquadFilter::new(); 10],
            filters_r: [BiquadFilter::new(); 10],
            gains: [0.0; 10],
        };
        eq.recalculate_all();
        eq
    }

    pub fn set_gain(&mut self, band_idx: usize, gain_db: f32) {
        if band_idx < 10 {
            self.gains[band_idx] = gain_db.clamp(-12.0, 12.0);
            let q = 1.414; // Standard 1-octave bandwidth Q
            let freq = FREQUENCIES[band_idx];
            self.filters_l[band_idx].set_peaking_eq(self.sample_rate, freq, self.gains[band_idx], q);
            self.filters_r[band_idx].set_peaking_eq(self.sample_rate, freq, self.gains[band_idx], q);
        }
    }

    pub fn recalculate_all(&mut self) {
        for i in 0..10 {
            self.set_gain(i, self.gains[i]);
        }
    }

    pub fn process_stereo(&mut self, left: &mut [f32], right: &mut [f32]) {
        for i in 0..left.len().min(right.len()) {
            let mut l = left[i];
            let mut r = right[i];
            for band in 0..10 {
                l = self.filters_l[band].process(l);
                r = self.filters_r[band].process(r);
            }
            left[i] = l;
            right[i] = r;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_biquad_flat_response() {
        let mut eq = Equalizer10Band::new(44100.0);
        let mut left = vec![1.0; 100];
        let mut right = vec![1.0; 100];

        eq.process_stereo(&mut left, &mut right);

        for sample in left.iter().chain(right.iter()) {
            assert!(!sample.is_nan());
            assert!(!sample.is_infinite());
        }
    }

    #[test]
    fn test_biquad_gain_adjustment() {
        let mut eq = Equalizer10Band::new(44100.0);
        eq.set_gain(0, 6.0); // Boost 31.25Hz by +6dB
        eq.set_gain(9, -6.0); // Cut 16kHz by -6dB

        let mut left = vec![0.5; 50];
        let mut right = vec![0.5; 50];

        eq.process_stereo(&mut left, &mut right);

        assert!(!left[10].is_nan());
        assert!(!right[10].is_nan());
    }
}

