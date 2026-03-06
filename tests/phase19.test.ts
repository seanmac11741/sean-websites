import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const about = readFileSync('src/components/About.astro', 'utf-8');

describe('19a — Wisconsin card markup', () => {
  it('has the wisconsin-card container with hover classes', () => {
    expect(about).toContain('id="wisconsin-card"');
    expect(about).toContain('relative cursor-default');
  });

  it('has default and hover view divs', () => {
    expect(about).toContain('id="wisconsin-default"');
    expect(about).toContain('id="wisconsin-hover"');
  });

  it('still shows Wisconsin / Based in text in default view', () => {
    expect(about).toContain('>Wisconsin<');
    expect(about).toContain('>Based in<');
  });

  it('has weather elements in hover view', () => {
    expect(about).toContain('id="weather-temp"');
    expect(about).toContain('Madison, WI');
  });

  it('hover view starts hidden', () => {
    const hoverMatch = about.match(/id="wisconsin-hover"[^>]*class="([^"]*)"/);
    expect(hoverMatch?.[1]).toContain('opacity-0');
  });
});

describe('19b — Wisconsin weather fetch', () => {
  it('fetches from Open-Meteo API with Madison coordinates', () => {
    expect(about).toContain('api.open-meteo.com/v1/forecast');
    expect(about).toContain('43.0731');
    expect(about).toContain('-89.4012');
  });

  it('requests Fahrenheit temperature', () => {
    expect(about).toContain('temperature_unit=fahrenheit');
  });

  it('has WMO weather code mapping function', () => {
    expect(about).toContain('wmoToCondition');
  });

  it('caches in localStorage with 30-min TTL', () => {
    expect(about).toContain('weather-madison');
    expect(about).toContain('30 * 60 * 1000');
    expect(about).toContain('localStorage');
  });

  it('has a fallback for API failure', () => {
    expect(about).toContain('catch');
  });

  it('calls loadWeather on page load', () => {
    expect(about).toContain('loadWeather()');
  });
});

describe('19c — AI & Cloud card markup', () => {
  it('has the aicloud-card container with hover classes', () => {
    expect(about).toContain('id="aicloud-card"');
  });

  it('has default and hover view divs', () => {
    expect(about).toContain('id="aicloud-default"');
    expect(about).toContain('id="aicloud-hover"');
  });

  it('still shows AI & Cloud / Specialty text in default view', () => {
    expect(about).toContain('>AI & Cloud<');
    expect(about).toContain('>Specialty<');
  });

  it('shows AWS Certified in hover view', () => {
    expect(about).toContain('AWS Certified');
  });

  it('shows specialties in hover view', () => {
    expect(about).toContain('GCP');
    expect(about).toContain('LLMs');
    expect(about).toContain('RAG');
    expect(about).toContain('Agents');
  });

  it('hover view starts hidden', () => {
    const hoverMatch = about.match(/id="aicloud-hover"[^>]*class="([^"]*)"/);
    expect(hoverMatch?.[1]).toContain('opacity-0');
  });
});

describe('19d — Hover interaction wiring', () => {
  it('has setupHoverCard helper function', () => {
    expect(about).toContain('setupHoverCard');
  });

  it('wires wisconsin card with setupHoverCard', () => {
    expect(about).toContain("setupHoverCard('wisconsin-card', 'wisconsin-default', 'wisconsin-hover')");
  });

  it('wires aicloud card with setupHoverCard', () => {
    expect(about).toContain("setupHoverCard('aicloud-card', 'aicloud-default', 'aicloud-hover')");
  });

  it('has mouseenter and mouseleave in setupHoverCard', () => {
    const setupFn = about.substring(about.indexOf('function setupHoverCard'), about.indexOf('setupHoverCard(\'wisconsin'));
    expect(setupFn).toContain('mouseenter');
    expect(setupFn).toContain('mouseleave');
  });

  it('has mobile tap-to-toggle via touchstart', () => {
    expect(about).toContain('touchstart');
  });

  it('all three highlight cards have hover pattern', () => {
    expect(about).toContain('id="experience-timer"');
    expect(about).toContain('id="wisconsin-card"');
    expect(about).toContain('id="aicloud-card"');

    expect(about).toContain('id="timer-default"');
    expect(about).toContain('id="timer-hover"');
    expect(about).toContain('id="wisconsin-default"');
    expect(about).toContain('id="wisconsin-hover"');
    expect(about).toContain('id="aicloud-default"');
    expect(about).toContain('id="aicloud-hover"');
  });
});
