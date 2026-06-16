import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const componentPath = join(root, 'src/components/Presentations.astro');
const newSlidePath = join(root, 'public/images/presentations/2026-IT-Professionals-Conference-Title-Slide.jpg');
const newSlidesLink = 'https://docs.google.com/presentation/d/1wJ2-CoKFZ-7xTK5UpJ3VC8nd03pE_bhu1Pps9IyScvc/edit?usp=sharing';
const newVideoLink = 'https://www.youtube.com/watch?v=Jz_nzVF0PRY';
const allianceSlidesLink = 'https://docs.google.com/presentation/d/1L3efRCwZOOlnf-U4ySECNgPCVpKw4jQ6TgGtBLooF0g/edit?usp=sharing';

function readPresentationsComponent() {
  return readFileSync(componentPath, 'utf8');
}

function getJpegDimensions(path: string) {
  const buffer = readFileSync(path);
  expect(buffer[0]).toBe(0xff);
  expect(buffer[1]).toBe(0xd8);

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xc3;

    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + length;
  }

  throw new Error('Could not read JPEG dimensions');
}

describe('2026 IT Professionals Conference title slide asset', () => {
  it('verifies the approved Google Slides deck is publicly reachable', async () => {
    const response = await fetch(newSlidesLink, { redirect: 'follow' });
    const html = await response.text();

    expect(response.ok).toBe(true);
    expect(response.url).not.toContain('/ServiceLogin');
    expect(html).toContain('Gemini-CLI-Tutor');
  });

  it('exports a readable 16:9 JPG title slide for the new presentation', () => {
    expect(existsSync(newSlidePath)).toBe(true);
    expect(statSync(newSlidePath).size).toBeGreaterThan(50_000);

    const { width, height } = getJpegDimensions(newSlidePath);
    expect(width).toBeGreaterThanOrEqual(960);
    expect(Math.abs(width / height - 16 / 9)).toBeLessThan(0.01);
  });

  it('uses a clear public presentations image path for the 2026 IT Professionals Conference', () => {
    expect(newSlidePath).toContain('public/images/presentations/2026-IT-Professionals-Conference-Title-Slide.jpg');
    expect(existsSync(newSlidePath)).toBe(true);
  });
});

describe('presentation data', () => {
  it('includes the approved 2026 IT Professionals Conference presentation entry', () => {
    const component = readPresentationsComponent();

    expect(component).toContain("title: 'Building an AI Tutor With Google Tools'");
    expect(component).toContain("event: '2026 IT Professionals Conference'");
    expect(component).toContain("date: '2026-05-29'");
    expect(component).toContain("description: 'A repeatable, model-agnostic approach to using AI tools effectively.'");
    expect(component).toContain(`link: '${newSlidesLink}'`);
    expect(component).toContain(`videoLink: '${newVideoLink}'`);
    expect(component).toContain("image: '/images/presentations/2026-IT-Professionals-Conference-Title-Slide.jpg'");
  });

  it('keeps the existing Alliance 2026 presentation available', () => {
    const component = readPresentationsComponent();

    expect(component).toContain("title: 'Adding Guardrails to AI with GitHub Copilot'");
    expect(component).toContain("event: 'Alliance 2026'");
    expect(component).toContain(`link: '${allianceSlidesLink}'`);
    expect(component).toContain("image: '/images/presentations/AllianceTitleSlide2026.jpg'");
  });

  it('sorts presentations by date descending before rendering', () => {
    const component = readPresentationsComponent();

    expect(component).toContain('sortedPresentations');
    expect(component).toContain('new Date(b.date).getTime() - new Date(a.date).getTime()');
  });
});

describe('featured presentation UI', () => {
  it('renders only the newest presentation as the primary featured card by default', () => {
    const component = readPresentationsComponent();

    expect(component).toContain('{featuredPresentation && (');
    expect(component).toContain('href={featuredPresentation.link}');
    expect(component).not.toContain('sortedPresentations.map');
  });

  it('preserves the dark featured-card visual style, original card size, and View Slides CTA', () => {
    const component = readPresentationsComponent();

    expect(component).toContain('grid grid-cols-1 sm:grid-cols-2 gap-6');
    expect(component).toContain('rounded-xl border border-white/10 bg-surface/40 overflow-hidden');
    expect(component).toContain('hover:border-accent/50 hover:-translate-y-1 hover:bg-surface/80');
    expect(component).toContain('aspect-video object-cover');
    expect(component).toContain('View Slides &rarr;');
    expect(component).toContain('Watch Video &rarr;');
  });

  it('opens the approved featured Google Slides deck safely in a new tab', () => {
    const component = readPresentationsComponent();

    expect(component).toContain(`link: '${newSlidesLink}'`);
    expect(component).toContain('href={featuredPresentation.link}');
    expect(component).toContain('target="_blank"');
    expect(component).toContain('rel="noopener noreferrer"');
  });

  it('links the featured presentation recording safely in a new tab', () => {
    const component = readPresentationsComponent();

    expect(component).toContain(`videoLink: '${newVideoLink}'`);
    expect(component).toContain('href={featuredPresentation.videoLink}');
    expect(component).toContain('Watch Video &rarr;');
    expect(component).toContain('target="_blank"');
    expect(component).toContain('rel="noopener noreferrer"');
  });
});

describe('previous presentations dropdown', () => {
  it('adds a collapsed Previous presentations disclosure below the featured card', () => {
    const component = readPresentationsComponent();

    expect(component).toContain('<details');
    expect(component).not.toContain('<details open');
    expect(component).toContain('Previous presentations');
    expect(component).toContain('previousPresentations');
  });

  it('includes a chevron indicator that changes between collapsed and expanded states', () => {
    const component = readPresentationsComponent();

    expect(component).toContain('previous-presentations-chevron');
    expect(component).toContain('details[open] .previous-presentations-chevron');
    expect(component).toContain('rotate(180deg)');
  });

  it('renders older presentations in a compact scannable layout', () => {
    const component = readPresentationsComponent();

    expect(component).toContain('previousPresentations.map');
    expect(component).toContain('previous-presentation-item');
    expect(component).toContain('href={p.link}');
    expect(component).toContain('{p.title}');
    expect(component).toContain('{p.description}');
  });

  it('keeps the Alliance 2026 slide deck reachable from the previous presentations list', () => {
    const component = readPresentationsComponent();

    expect(component).toContain(`link: '${allianceSlidesLink}'`);
    expect(component).toContain('href={p.link}');
    expect(component).toContain('previousPresentations.map');
  });
});

describe('accessibility and responsiveness', () => {
  it('uses a native keyboard-accessible disclosure control', () => {
    const component = readPresentationsComponent();

    expect(component).toContain('<details');
    expect(component).toContain('<summary');
    expect(component).toContain('aria-label="Toggle previous presentations"');
  });

  it('keeps mobile and desktop layouts readable without horizontal overflow', () => {
    const component = readPresentationsComponent();

    expect(component).toContain('max-w-6xl mx-auto px-6');
    expect(component).toContain('w-full aspect-video object-cover');
    expect(component).toContain('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between');
    expect(component).toContain('min-w-0');
    expect(component).toContain('shrink-0');
  });

  it('uses meaningful image alt text for the featured presentation title slide', () => {
    const component = readPresentationsComponent();

    expect(component).toContain('alt={`${featuredPresentation.title} title slide for ${featuredPresentation.event}`}');
  });
});
