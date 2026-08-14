import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

// When repeat focus appears, what duration it repeats and what it does to the
// Session are Session rules — see tests/lib/timer.test.ts. What survives here
// is the one decision the markup encodes: repeat focus is the primary action
// on the transition screen, and taking a break is the secondary one.
describe('Repeatable focus timer', () => {
  it('styles repeat focus as the primary post-focus action', () => {
    const repeatMarkup = page.slice(page.indexOf('id="repeat-focus-btn"'), page.indexOf('</button>', page.indexOf('id="repeat-focus-btn"')));
    const breakMarkup = page.slice(page.indexOf('id="break-btn"'), page.indexOf('</button>', page.indexOf('id="break-btn"')));
    expect(repeatMarkup).toContain('bg-accent');
    expect(repeatMarkup).toContain('shadow-accent/25');
    expect(breakMarkup).toContain('border-white/20');
    expect(breakMarkup).not.toContain('bg-accent');
  });

  // Deliberately absent, and not something the Session module can say: focus
  // durations start at 25 minutes, and 15 belongs to breaks only.
  it('does not add a 15-minute focus preset', () => {
    const focusPresets = page.slice(page.indexOf('id="focus-presets"'), page.indexOf('id="initial-break-presets"'));
    expect(focusPresets).not.toContain('data-minutes="15"');
    expect(focusPresets).toContain('data-minutes="25"');
    expect(page).toContain('id="custom-minutes"');
  });
});
