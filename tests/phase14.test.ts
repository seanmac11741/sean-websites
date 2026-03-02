import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('14a — Favicon', () => {
  it('favicon.ico exists in public/', () => {
    expect(existsSync('public/favicon.ico')).toBe(true);
  });

  it('apple-touch-icon.png exists in public/', () => {
    expect(existsSync('public/apple-touch-icon.png')).toBe(true);
  });

  it('old favicon.svg is removed', () => {
    expect(existsSync('public/favicon.svg')).toBe(false);
  });

  it('Layout.astro references favicon.ico and apple-touch-icon', () => {
    const layout = readFileSync('src/layouts/Layout.astro', 'utf-8');
    expect(layout).toContain('href="/favicon.ico"');
    expect(layout).toContain('href="/apple-touch-icon.png"');
    expect(layout).not.toContain('favicon.svg');
  });
});

describe('14b — Dynamic years of experience', () => {
  const about = readFileSync('src/components/About.astro', 'utf-8');

  it('has frontmatter that calculates years from April 23 2015', () => {
    expect(about).toContain('new Date(2015, 3, 23)');
  });

  it('uses {years} in the bio paragraph instead of hardcoded number', () => {
    expect(about).toContain('{years} years of experience');
    expect(about).not.toMatch(/with \d+ years of experience/);
  });

  it('has a live experience timer with hover detail', () => {
    expect(about).toContain('id="experience-timer"');
    expect(about).toContain('id="timer-hover"');
  });
});

describe('14c — McConnell cutoff fix', () => {
  it('Hero h1 uses gradual responsive sizing', () => {
    const hero = readFileSync('src/components/Hero.astro', 'utf-8');
    expect(hero).toContain('text-5xl sm:text-6xl lg:text-7xl xl:text-8xl');
  });
});

describe('14d — Strava social links', () => {
  const stravaUrl = 'https://www.strava.com/athletes/73335553';

  it('Hero.astro has Strava link', () => {
    const hero = readFileSync('src/components/Hero.astro', 'utf-8');
    expect(hero).toContain(stravaUrl);
    expect(hero).toContain('aria-label="Strava"');
  });

  it('Nav.astro has Strava link in desktop and mobile sections', () => {
    const nav = readFileSync('src/components/Nav.astro', 'utf-8');
    const matches = nav.match(new RegExp(stravaUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
    expect(matches).toHaveLength(2);
  });

  it('Footer.astro has Strava link', () => {
    const footer = readFileSync('src/components/Footer.astro', 'utf-8');
    expect(footer).toContain(stravaUrl);
    expect(footer).toContain('aria-label="Strava"');
  });
});

describe('14e — "Make me one" CTA', () => {
  const footer = readFileSync('src/components/Footer.astro', 'utf-8');

  it('Footer has the CTA text', () => {
    expect(footer).toContain('Like this site? I can build one for you.');
  });

  it('Footer has a "Request a website" button', () => {
    expect(footer).toContain('Request a website');
  });

  it('has the Google Form URL', () => {
    expect(footer).toContain('https://forms.gle/fFCFyQH7dG6xXtkVA');
  });
});
