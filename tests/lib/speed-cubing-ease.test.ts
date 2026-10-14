import { describe, expect, it } from 'vitest';
import { easeTurn } from '../../src/lib/speed-cubing/ease';

const samples = Array.from({ length: 1001 }, (_, i) => i / 1000);

describe('easeTurn', () => {
  it('starts at rest and ends exactly on the turn', () => {
    expect(easeTurn(0)).toBe(0);
    expect(easeTurn(1)).toBe(1);
  });

  it('holds before the start and after the end', () => {
    expect(easeTurn(-0.5)).toBe(0);
    expect(easeTurn(1.5)).toBe(1);
  });

  it('eases in and out: slow at both ends, fast in the middle', () => {
    const speed = (t: number) => (easeTurn(t + 0.005) - easeTurn(t - 0.005)) / 0.01;
    expect(Math.abs(speed(0.005))).toBeLessThan(0.1);
    expect(Math.abs(speed(0.995))).toBeLessThan(0.1);
    expect(speed(0.4)).toBeGreaterThan(1.5);
  });

  it('overshoots slightly, by under a tenth of the turn, and settles back', () => {
    const peak = Math.max(...samples.map(easeTurn));
    expect(peak).toBeGreaterThan(1.02);
    expect(peak).toBeLessThan(1.1);
  });

  it('never winds back before it starts', () => {
    expect(Math.min(...samples.map(easeTurn))).toBe(0);
  });

  it('never jumps', () => {
    for (let i = 1; i < samples.length; i++) {
      expect(Math.abs(easeTurn(samples[i]) - easeTurn(samples[i - 1]))).toBeLessThan(0.01);
    }
  });
});
