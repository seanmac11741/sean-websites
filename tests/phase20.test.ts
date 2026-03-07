import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const footer = readFileSync('src/components/Footer.astro', 'utf-8');

describe('20 — Buy Me a Coffee link', () => {
  it('links to the correct Buy Me a Coffee URL', () => {
    expect(footer).toContain('https://buymeacoffee.com/seanmcconnell');
  });

  it('opens in a new tab', () => {
    const idx = footer.indexOf('buymeacoffee.com');
    const surrounding = footer.slice(idx - 200, idx + 200);
    expect(surrounding).toContain('target="_blank"');
    expect(surrounding).toContain('rel="noopener noreferrer"');
  });

  it('has visible label text', () => {
    expect(footer).toContain('Buy me a coffee');
  });
});
