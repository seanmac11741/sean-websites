import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('Phase 32 — Tools Page & Flowstate Timer', () => {
  // === Todo 1: /tools index page ===
  describe('Tools index page', () => {
    it('exists at src/pages/tools/index.astro', () => {
      expect(existsSync('src/pages/tools/index.astro')).toBe(true);
    });

    it('imports Layout and Nav components', () => {
      const page = readFileSync('src/pages/tools/index.astro', 'utf-8');
      expect(page).toContain("import Layout from");
      expect(page).toContain("import Nav from");
    });

    it('passes a title to Layout', () => {
      const page = readFileSync('src/pages/tools/index.astro', 'utf-8');
      expect(page).toContain('Tools');
    });

    it('has a card grid container', () => {
      const page = readFileSync('src/pages/tools/index.astro', 'utf-8');
      expect(page).toContain('grid');
    });

    it('has a card linking to /tools/flowstate-timer', () => {
      const page = readFileSync('src/pages/tools/index.astro', 'utf-8');
      expect(page).toContain('/tools/flowstate-timer');
    });

    it('has a title and description for the flowstate timer card', () => {
      const page = readFileSync('src/pages/tools/index.astro', 'utf-8');
      expect(page).toContain('Flowstate Timer');
    });
  });

  // === Todo 2: Tools link in Nav ===
  describe('Nav has Tools link', () => {
    const nav = readFileSync('src/components/Nav.astro', 'utf-8');

    it('has a desktop Tools link pointing to /tools', () => {
      expect(nav).toContain('href="/tools"');
    });

    it('has Tools link text in desktop nav', () => {
      const desktopSection = nav.split('Mobile Menu Button')[0];
      expect(desktopSection).toContain('Tools');
    });

    it('has Tools link in mobile nav', () => {
      const mobileSection = nav.split('mobile-menu')[1];
      expect(mobileSection).toContain('/tools');
      expect(mobileSection).toContain('Tools');
    });

    it('Tools link appears between Blog and Admin in desktop nav', () => {
      const blogIdx = nav.indexOf('href="/blog"');
      const toolsIdx = nav.indexOf('href="/tools"');
      const adminIdx = nav.indexOf('id="admin-nav-link"');
      expect(toolsIdx).toBeGreaterThan(blogIdx);
      expect(toolsIdx).toBeLessThan(adminIdx);
    });
  });

  // === Todo 3: Flowstate timer page scaffold ===
  describe('Flowstate timer page', () => {
    it('exists at src/pages/tools/flowstate-timer.astro', () => {
      expect(existsSync('src/pages/tools/flowstate-timer.astro')).toBe(true);
    });

    it('imports Layout and Nav', () => {
      const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');
      expect(page).toContain("import Layout from");
      expect(page).toContain("import Nav from");
    });

    it('has a Flowstate Timer title', () => {
      const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');
      expect(page).toContain('Flowstate Timer');
    });

    it('has a main content area with a timer container', () => {
      const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');
      expect(page).toContain('id="timer-container"');
    });
  });

  // === Todo 4: Preset duration buttons + custom input ===
  describe('Preset duration buttons', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has focus preset buttons for 25, 60, 90, 120 minutes', () => {
      expect(page).toContain('data-minutes="25"');
      expect(page).toContain('data-minutes="60"');
      expect(page).toContain('data-minutes="90"');
      expect(page).toContain('data-minutes="120"');
    });

    it('has 90 min as the default selected focus preset', () => {
      const idx = page.indexOf('data-minutes="90"');
      const surrounding = page.slice(Math.max(0, idx - 200), idx + 200);
      expect(surrounding).toContain('data-default');
    });

    it('has a custom duration input', () => {
      expect(page).toContain('id="custom-minutes"');
    });

    it('has a presets container', () => {
      expect(page).toContain('id="presets-container"');
    });
  });

  // === Todo 5: Big Start button ===
  describe('Start button', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has a prominent start button', () => {
      expect(page).toContain('id="start-btn"');
    });

    it('start button has large styling', () => {
      const idx = page.indexOf('id="start-btn"');
      const surrounding = page.slice(Math.max(0, idx - 300), idx + 300);
      expect(surrounding).toMatch(/text-(lg|xl|2xl|3xl)/);
    });

    it('start button says Start', () => {
      const idx = page.indexOf('id="start-btn"');
      const surrounding = page.slice(idx, idx + 300);
      expect(surrounding).toContain('Start');
    });
  });

  // === Todo 6: SVG progress ring + digits ===
  describe('SVG progress ring and digits', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has an SVG element for the timer ring', () => {
      expect(page).toContain('<svg');
      expect(page).toContain('id="timer-ring"');
    });

    it('has a circle element for the progress track', () => {
      expect(page).toContain('<circle');
      expect(page).toContain('id="ring-track"');
    });

    it('has a circle element for the progress indicator', () => {
      expect(page).toContain('id="ring-progress"');
    });

    it('has a digits display with timer-digit class', () => {
      expect(page).toContain('id="timer-display"');
      expect(page).toContain('timer-digit');
    });

    it('timer display is hidden initially', () => {
      const idx = page.indexOf('id="timer-display-container"');
      const surrounding = page.slice(Math.max(0, idx - 100), idx + 200);
      expect(surrounding).toContain('hidden');
    });
  });

  // === Todo 7: Countdown timer logic ===
  describe('Countdown timer logic', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has a client-side script tag', () => {
      expect(page).toContain('<script>');
    });

    it('uses requestAnimationFrame for the timer loop', () => {
      expect(page).toContain('requestAnimationFrame');
    });

    it('has logic to update the ring stroke-dashoffset', () => {
      expect(page).toContain('strokeDashoffset');
    });

    it('has logic to format time as MM:SS', () => {
      expect(page).toMatch(/Math\.floor|padStart/);
    });

    it('selects preset buttons and handles click events', () => {
      expect(page).toContain('preset-btn');
      expect(page).toContain('addEventListener');
    });
  });

  // === Todo 8: Pause/Resume and Reset buttons ===
  describe('Pause/Resume and Reset buttons', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has a pause/resume button', () => {
      expect(page).toContain('id="pause-btn"');
    });

    it('has a reset button', () => {
      expect(page).toContain('id="reset-btn"');
    });

    it('buttons are pill-shaped (rounded-full)', () => {
      const pauseIdx = page.indexOf('id="pause-btn"');
      const pauseSurrounding = page.slice(Math.max(0, pauseIdx - 200), pauseIdx + 200);
      expect(pauseSurrounding).toContain('rounded-full');

      const resetIdx = page.indexOf('id="reset-btn"');
      const resetSurrounding = page.slice(Math.max(0, resetIdx - 200), resetIdx + 200);
      expect(resetSurrounding).toContain('rounded-full');
    });

    it('buttons are inside the timer display container', () => {
      const timerContainerStart = page.indexOf('id="timer-display-container"');
      const pauseIdx = page.indexOf('id="pause-btn"');
      const resetIdx = page.indexOf('id="reset-btn"');
      expect(pauseIdx).toBeGreaterThan(timerContainerStart);
      expect(resetIdx).toBeGreaterThan(timerContainerStart);
    });

    it('has pause/resume click handler in script', () => {
      expect(page).toContain('pause-btn');
      expect(page).toContain('cancelAnimationFrame');
    });
  });

  // === Todo 9: GSAP theatrical entrance ===
  describe('GSAP entrance animation', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('imports gsap', () => {
      expect(page).toContain("import { gsap }");
    });

    it('uses gsap.timeline or gsap.to for entrance animation', () => {
      expect(page).toMatch(/gsap\.(timeline|to|from|fromTo)/);
    });

    it('animates the ring drawing on (stroke-dashoffset)', () => {
      expect(page).toContain('strokeDashoffset');
    });

    it('animates the timer display scaling up', () => {
      expect(page).toMatch(/scale|opacity/);
    });
  });

  // === Todo 10: Web Audio API alarm ===
  describe('Web Audio API alarm', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('creates an AudioContext', () => {
      expect(page).toContain('AudioContext');
    });

    it('uses OscillatorNode for tone generation', () => {
      expect(page).toContain('createOscillator');
    });

    it('has a repeating alarm mechanism with setInterval', () => {
      expect(page).toContain('setInterval');
    });

    it('alarm is triggered in onTimerComplete', () => {
      expect(page).toContain('onTimerComplete');
      expect(page).toContain('startAlarm');
    });
  });

  // === Todo 11: Dismiss button ===
  describe('Alarm dismiss button', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has a dismiss button', () => {
      expect(page).toContain('id="dismiss-btn"');
    });

    it('dismiss button is hidden initially', () => {
      const idx = page.indexOf('id="dismiss-btn"');
      const surrounding = page.slice(Math.max(0, idx - 300), idx + 100);
      expect(surrounding).toContain('hidden');
    });

    it('dismiss button calls stopAlarm', () => {
      expect(page).toContain('stopAlarm');
    });
  });

  // === Todo 12: Ring pulses red at zero ===
  describe('Ring pulse animation at zero', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has a pulseRing function that animates the ring red', () => {
      expect(page).toContain('pulseRing');
    });

    it('pulseRing uses gsap to animate stroke color', () => {
      const pulseSection = page.slice(page.indexOf('pulseRing'));
      expect(pulseSection).toContain('stroke');
      expect(pulseSection).toMatch(/gsap\.(to|fromTo|timeline)/);
    });

    it('onTimerComplete calls pulseRing', () => {
      const completeSection = page.slice(page.indexOf('function onTimerComplete'));
      const nextFnIdx = completeSection.indexOf('function ', 1);
      const body = nextFnIdx > 0 ? completeSection.slice(0, nextFnIdx) : completeSection.slice(0, 300);
      expect(body).toContain('pulseRing');
    });
  });

  // === Todo 13: Post-focus flow ===
  describe('Post-focus transition', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has a transition container for phrases and next-mode button', () => {
      expect(page).toContain('id="transition-container"');
    });

    it('has a phrase display element', () => {
      expect(page).toContain('id="phrase-display"');
    });

    it('has a Take a Break button', () => {
      expect(page).toContain('id="break-btn"');
      expect(page).toContain('Take a Break');
    });

    it('transition container is hidden initially', () => {
      const idx = page.indexOf('id="transition-container"');
      const surrounding = page.slice(Math.max(0, idx - 200), idx + 100);
      expect(surrounding).toContain('hidden');
    });

    it('onAlarmDismissed shows the transition container', () => {
      const section = page.slice(page.indexOf('onAlarmDismissed'));
      expect(section).toContain('transitionContainer');
    });
  });

  // === Todo 14: Break timer mode ===
  describe('Break timer mode', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has break preset buttons for 5, 15, 30 minutes', () => {
      expect(page).toContain('data-break-minutes="5"');
      expect(page).toContain('data-break-minutes="15"');
      expect(page).toContain('data-break-minutes="30"');
    });

    it('has 30 min as the default break preset', () => {
      const idx = page.indexOf('data-break-minutes="30"');
      const surrounding = page.slice(Math.max(0, idx - 200), idx + 200);
      expect(surrounding).toContain('data-default');
    });

    it('has a break color defined different from focus accent', () => {
      expect(page).toMatch(/#(2dd4bf|34d399|4ade80|10b981)/);
    });

    it('break button click switches mode to break and starts timer', () => {
      const breakSection = page.slice(page.indexOf('breakBtn'));
      expect(breakSection).toContain("mode = 'break'");
    });
  });

  // === Todo 15: Post-break flow loops back to focus ===
  describe('Post-break flow', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('onAlarmDismissed handles break mode with Start Focus text', () => {
      const section = page.slice(page.indexOf('onAlarmDismissed'));
      expect(section).toContain('Start Focus');
    });

    it('breakBtn click switches mode back to focus', () => {
      const section = page.slice(page.indexOf('breakBtn.addEventListener'));
      expect(section).toContain("mode = 'focus'");
    });

    it('restores focus color when switching back to focus', () => {
      const section = page.slice(page.indexOf('breakBtn.addEventListener'));
      expect(section).toContain('FOCUS_COLOR');
    });
  });

  // === Todo 16: Post-focus fun phrases ===
  describe('Post-focus fun phrases', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has at least 8 focus phrases', () => {
      const match = page.match(/focusPhrases.*?=.*?\[([\s\S]*?)\]/);
      expect(match).not.toBeNull();
      const items = match![1].split(',').filter((s: string) => s.trim().length > 0);
      expect(items.length).toBeGreaterThanOrEqual(8);
    });

    it('focus phrases include relaxation-themed content', () => {
      const section = page.slice(page.indexOf('focusPhrases'));
      expect(section).toMatch(/(nap|relax|stretch|walk|breathe|rest|cat|snack)/i);
    });
  });

  // === Todo 17: Post-break fun phrases ===
  describe('Post-break fun phrases', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has at least 8 break phrases', () => {
      const match = page.match(/breakPhrases.*?=.*?\[([\s\S]*?)\]/);
      expect(match).not.toBeNull();
      const items = match![1].split(',').filter((s: string) => s.trim().length > 0);
      expect(items.length).toBeGreaterThanOrEqual(8);
    });

    it('break phrases include motivation-themed content', () => {
      const section = page.slice(page.indexOf('breakPhrases'));
      expect(section).toMatch(/(crush|focus|lock|go|build|ship|grind|flow)/i);
    });
  });

  // === Todo 18: localStorage persistence ===
  describe('Timer state persistence', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('saves state to localStorage', () => {
      expect(page).toContain('localStorage.setItem');
    });

    it('uses a consistent storage key', () => {
      expect(page).toContain('flowstate-timer');
    });

    it('saves mode, remaining seconds, and total seconds', () => {
      expect(page).toContain('remainingSeconds');
      expect(page).toContain('totalSeconds');
      expect(page).toContain('mode');
    });

    it('has a saveState function', () => {
      expect(page).toContain('saveState');
    });
  });

  // === Todo 19: Resume prompt on page load ===
  describe('Resume session prompt', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has a resume prompt container', () => {
      expect(page).toContain('id="resume-prompt"');
    });

    it('resume prompt is hidden initially', () => {
      const idx = page.indexOf('id="resume-prompt"');
      const surrounding = page.slice(Math.max(0, idx - 200), idx + 100);
      expect(surrounding).toContain('hidden');
    });

    it('has yes and no buttons for the resume prompt', () => {
      expect(page).toContain('id="resume-yes"');
      expect(page).toContain('id="resume-no"');
    });

    it('checks localStorage on page load', () => {
      expect(page).toContain('localStorage.getItem');
    });

    it('has a resume message element', () => {
      expect(page).toContain('id="resume-message"');
    });
  });

  // === Todo 20: Responsive layout ===
  describe('Responsive mobile layout', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('SVG ring has responsive sizing via viewBox', () => {
      expect(page).toContain('viewBox');
    });

    it('timer display uses responsive text sizing', () => {
      expect(page).toMatch(/text-\d+xl\s+sm:text-\d+xl/);
    });

    it('preset buttons use flex-wrap for small screens', () => {
      expect(page).toContain('flex-wrap');
    });

    it('main container uses responsive padding', () => {
      expect(page).toContain('px-6');
    });

    it('SVG ring uses max-w or w-full for responsive width', () => {
      const svgIdx = page.indexOf('id="timer-ring"');
      const surrounding = page.slice(Math.max(0, svgIdx - 300), svgIdx + 300);
      expect(surrounding).toMatch(/(max-w|w-full|class.*w-)/);
    });
  });
});
