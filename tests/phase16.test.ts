import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const about = readFileSync('src/components/About.astro', 'utf-8');
const css = readFileSync('src/styles/global.css', 'utf-8');

describe('16a — Live experience timer', () => {
  it('uses April 23, 2015 as the start date in frontmatter', () => {
    expect(about).toContain('new Date(2015, 3, 23)');
  });

  it('has all six timer unit elements', () => {
    const ids = ['timer-years', 'timer-months', 'timer-days', 'timer-hours', 'timer-minutes', 'timer-seconds'];
    for (const id of ids) {
      expect(about).toContain(`id="${id}"`);
    }
  });

  it('has setInterval for live updates', () => {
    expect(about).toContain('setInterval(updateTimer, 1000)');
  });

  it('has the experience-timer container', () => {
    expect(about).toContain('id="experience-timer"');
  });

  it('shows {years}+ and Years of Experience by default', () => {
    expect(about).toContain('{years}+');
    expect(about).toContain('Years of Experience');
  });

  it('has a hover state with exact experience text', () => {
    expect(about).toContain('id="timer-hover"');
    expect(about).toContain('id="timer-default"');
    expect(about).toContain('Exact years of experience as a software engineer');
  });

  it('has hover event listeners', () => {
    expect(about).toContain("addEventListener('mouseenter'");
    expect(about).toContain("addEventListener('mouseleave'");
  });

  it('has smaller sub-unit labels in hover view', () => {
    expect(about).toContain('mo</');
    expect(about).toContain('days</');
    expect(about).toContain('hrs</');
    expect(about).toContain('min</');
    expect(about).toContain('sec</');
  });

  it('uses the START constant in client-side script', () => {
    expect(about).toContain('const START = new Date(2015, 3, 23)');
  });
});

describe('16b — Bio text', () => {
  it('still uses dynamic {years} in the bio paragraph', () => {
    expect(about).toContain('{years} years of experience');
    expect(about).not.toMatch(/with \d+ years of experience/);
  });
});

describe('16c — Timer CSS', () => {
  it('has tabular-nums for timer digits', () => {
    expect(css).toContain('.timer-digit');
    expect(css).toContain('tabular-nums');
  });
});

describe('16 — Other highlights unchanged', () => {
  it('still has Wisconsin highlight', () => {
    expect(about).toContain('>Wisconsin<');
    expect(about).toContain('>Based in<');
  });

  it('still has AI & Cloud highlight', () => {
    expect(about).toContain('>AI & Cloud<');
    expect(about).toContain('>Specialty<');
  });
});
