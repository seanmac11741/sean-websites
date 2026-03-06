import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const presentations = readFileSync('src/components/Presentations.astro', 'utf-8');
const index = readFileSync('src/pages/index.astro', 'utf-8');
const nav = readFileSync('src/components/Nav.astro', 'utf-8');

describe('18a — Presentations component', () => {
  it('has the presentations section ID', () => {
    expect(presentations).toContain('id="presentations"');
  });

  it('has the presentations heading ID', () => {
    expect(presentations).toContain('id="presentations-heading"');
  });

  it('contains the Alliance 2026 title', () => {
    expect(presentations).toContain('Adding Guardrails to AI with GitHub Copilot');
  });

  it('contains the Alliance 2026 event name', () => {
    expect(presentations).toContain('Alliance 2026');
  });

  it('contains the Google Slides link', () => {
    expect(presentations).toContain('docs.google.com/presentation');
  });

  it('references the title slide image', () => {
    expect(presentations).toContain('AllianceTitleSlide2026.jpg');
  });

  it('has the presentation-card class', () => {
    expect(presentations).toContain('presentation-card');
  });
});

describe('18a — index.astro wiring', () => {
  it('imports Presentations component', () => {
    expect(index).toContain("import Presentations from");
  });

  it('renders Presentations between About and Skills', () => {
    const aboutIdx = index.indexOf('<About />');
    const presentationsIdx = index.indexOf('<Presentations />');
    const skillsIdx = index.indexOf('<Skills />');
    expect(presentationsIdx).toBeGreaterThan(aboutIdx);
    expect(presentationsIdx).toBeLessThan(skillsIdx);
  });
});

describe('18b — Nav link', () => {
  it('has a desktop nav link to #presentations', () => {
    expect(nav).toContain('href="#presentations"');
  });

  it('has the link text "Presentations"', () => {
    expect(nav).toContain('>Presentations<');
  });
});
