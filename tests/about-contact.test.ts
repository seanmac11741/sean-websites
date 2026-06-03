import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const about = readFileSync('src/components/About.astro', 'utf-8');

describe('About contact options', () => {
  it('renders a compact contact row immediately after the opening professional summary', () => {
    expect(about).toContain('id="about-contact-row"');
    const summaryIndex = about.indexOf('Research Systems Engineer on UW–Madison’s Research Cyberinfrastructure team');
    const summaryCloseIndex = about.indexOf('</p>', summaryIndex);
    const contactRowIndex = about.indexOf('id="about-contact-row"');
    const nextParagraphIndex = about.indexOf('Right now I\'m building secure storage', summaryCloseIndex);

    expect(contactRowIndex).toBeGreaterThan(summaryCloseIndex);
    expect(contactRowIndex).toBeLessThan(nextParagraphIndex);
  });

  it('labels the first contact option as UW-Madison email', () => {
    const rowStart = about.indexOf('id="about-contact-row"');
    const buttonIndex = about.indexOf('<button', rowStart);
    const labelIndex = about.indexOf('UW-Madison email', rowStart);
    const secondOptionIndex = about.indexOf('<a', rowStart);

    expect(labelIndex).toBeGreaterThan(buttonIndex);
    expect(labelIndex).toBeLessThan(secondOptionIndex);
  });

  it('labels the second option for personal projects and links to the existing Gmail contact path', () => {
    const rowStart = about.indexOf('id="about-contact-row"');
    const personalLinkStart = about.indexOf('<a', rowStart);
    const personalLinkEnd = about.indexOf('</a>', personalLinkStart);
    const personalLink = about.slice(personalLinkStart, personalLinkEnd);

    expect(personalLink).toContain('href="mailto:seanmac11741@gmail.com"');
    expect(personalLink).toContain('Personal projects');
  });

  it('uses responsive row classes for clean mobile and desktop spacing', () => {
    const rowTag = about.match(/<div id="about-contact-row" class="([^"]+)"/);

    expect(rowTag?.[1]).toContain('flex-col');
    expect(rowTag?.[1]).toContain('sm:flex-row');
    expect(rowTag?.[1]).toContain('gap-3');
    expect(rowTag?.[1]).toContain('mb-6');
  });

  it('implements the UW-Madison email option as a JavaScript clipboard copy button', () => {
    const rowStart = about.indexOf('id="about-contact-row"');
    const uwButtonStart = about.indexOf('<button', rowStart);
    const uwButtonEnd = about.indexOf('</button>', uwButtonStart);
    const uwButton = about.slice(uwButtonStart, uwButtonEnd);

    expect(uwButton).toContain('id="uw-email-copy"');
    expect(uwButton).not.toContain('mailto:');
    expect(about).toContain('navigator.clipboard.writeText');
    expect(about).toContain("document.getElementById('uw-email-copy')");
  });

  it('assembles the UW-Madison email only in client-side JavaScript without the full address as static text', () => {
    expect(about).not.toContain('sean.mcconnell@wisc.edu');
    expect(about).toContain("['sean.mcconnell', 'wisc.edu'].join('@')");
  });

  it('changes the UW-Madison copy button label to Copied after successful copying', () => {
    expect(about).toContain('id="uw-email-copy-label"');
    expect(about).toContain("uwEmailLabel.textContent = 'Copied!'");
  });

  it('includes graceful fallback messaging when clipboard copying is unavailable', () => {
    expect(about).toContain('id="uw-email-status"');
    expect(about).toContain("'Please email Sean at sean dot mcconnell at wisc dot edu.'");
    expect(about).toContain('catch');
  });

  it('does not expose the full UW-Madison email as plain visible static About markup', () => {
    const staticMarkup = about.slice(0, about.indexOf('<script>'));

    expect(staticMarkup).not.toContain('sean.mcconnell@wisc.edu');
    expect(staticMarkup).not.toContain('mailto:sean.mcconnell@wisc.edu');
  });

  it('brands the UW-Madison contact button as a stronger contact-me CTA', () => {
    const rowStart = about.indexOf('id="about-contact-row"');
    const uwButtonStart = about.indexOf('<button', rowStart);
    const uwButtonEnd = about.indexOf('</button>', uwButtonStart);
    const uwButton = about.slice(uwButtonStart, uwButtonEnd);

    expect(uwButton).toContain('Contact me');
    expect(uwButton).toContain('/images/uw-motion-w.png');
    expect(uwButton).toContain('alt="UW-Madison"');
    expect(uwButton).toContain('bg-gradient-to-br');
  });
});
