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

  // === Bug fixes ===
  describe('Bug fixes', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('reset handler restores presets opacity via gsap.set', () => {
      const resetSection = page.slice(page.indexOf('resetBtn.addEventListener'));
      expect(resetSection).toContain('gsap.set(presetsContainer');
      expect(resetSection).toContain('opacity: 1');
    });

    it('has Focus/Break mode toggle buttons on preset screen', () => {
      expect(page).toContain('id="mode-toggle-focus"');
      expect(page).toContain('id="mode-toggle-break"');
    });

    it('mode toggle switches to break mode and shows break presets', () => {
      const section = page.slice(page.indexOf('modeToggleBreak.addEventListener'));
      expect(section).toContain("mode = 'break'");
      expect(section).toContain('initialBreakPresetsContainer');
    });

    it('mode toggle switches back to focus mode', () => {
      const section = page.slice(page.indexOf('modeToggleFocus.addEventListener'));
      expect(section).toContain("mode = 'focus'");
    });

    it('has initial break presets (5, 15, 30) on preset screen', () => {
      expect(page).toContain('id="initial-break-presets"');
      const section = page.split('initial-break-presets')[1];
      expect(section).toContain('data-minutes="5"');
      expect(section).toContain('data-minutes="15"');
      expect(section).toContain('data-minutes="30"');
    });
  });

  // === Todo 21: Canvas star field with constellations ===
  describe('Canvas star field with constellations', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has a canvas element for the star field', () => {
      expect(page).toContain('<canvas');
      expect(page).toContain('id="starfield-canvas"');
    });

    it('canvas is positioned behind the timer (fixed/absolute, z-index)', () => {
      const idx = page.indexOf('id="starfield-canvas"');
      const surrounding = page.slice(Math.max(0, idx - 300), idx + 300);
      expect(surrounding).toMatch(/fixed|absolute/);
      expect(surrounding).toMatch(/z-/);
    });

    it('canvas covers the full viewport', () => {
      const idx = page.indexOf('id="starfield-canvas"');
      const surrounding = page.slice(Math.max(0, idx - 300), idx + 300);
      expect(surrounding).toMatch(/w-full|width.*100|inset-0/);
      expect(surrounding).toMatch(/h-full|height.*100|inset-0/);
    });

    it('has constellation data with star positions', () => {
      expect(page).toMatch(/constellations|CONSTELLATIONS/);
    });

    it('constellation data includes real northern hemisphere constellations', () => {
      expect(page).toContain('Ursa Major');
      expect(page).toContain('Ursa Minor');
      expect(page).toContain('Orion');
      expect(page).toContain('Cassiopeia');
    });

    it('each constellation has stars array with coordinates', () => {
      expect(page).toMatch(/stars\s*:/);
    });

    it('each constellation has lines array for connecting stars', () => {
      expect(page).toMatch(/lines\s*:/);
    });

    it('has a function to draw stars on the canvas', () => {
      expect(page).toMatch(/drawStars|drawField|renderStars|renderField/);
    });

    it('has a function to draw constellation lines', () => {
      expect(page).toMatch(/drawLines|drawConstellations|renderLines/);
    });

    it('canvas is hidden initially (before timer starts)', () => {
      const idx = page.indexOf('id="starfield-canvas"');
      const surrounding = page.slice(Math.max(0, idx - 300), idx + 300);
      expect(surrounding).toMatch(/hidden|opacity.*0|display.*none/);
    });
  });

  // === Todo 22: Star field fades in on first timer start ===
  describe('Star field fade-in on timer start', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('showStarfield is called inside startTimer', () => {
      const startTimerSection = page.slice(page.indexOf('function startTimer'));
      const nextFn = startTimerSection.indexOf('\n  function ', 10);
      const body = nextFn > 0 ? startTimerSection.slice(0, nextFn) : startTimerSection.slice(0, 800);
      expect(body).toContain('showStarfield');
    });

    it('showStarfield uses gsap to fade in the canvas', () => {
      const section = page.slice(page.indexOf('function showStarfield'));
      expect(section).toMatch(/gsap\.(to|fromTo)\(starfieldCanvas/);
    });

    it('showStarfield only runs once (guard against repeated calls)', () => {
      const section = page.slice(page.indexOf('function showStarfield'));
      expect(section).toMatch(/if\s*\(\s*starfieldVisible\s*\)\s*return/);
    });

    it('star field persists through session (no hide on reset/transition)', () => {
      // The reset handler should NOT hide the starfield canvas
      const resetSection = page.slice(page.indexOf('resetBtn.addEventListener'));
      const nextSection = resetSection.indexOf('\n  //', 10);
      const body = nextSection > 0 ? resetSection.slice(0, nextSection) : resetSection.slice(0, 600);
      expect(body).not.toContain('starfield');
    });

    it('showStarfield is also called on resume (resumeYes click)', () => {
      const resumeSection = page.slice(page.indexOf('resumeYes.addEventListener'));
      const endSection = resumeSection.indexOf('});', resumeSection.indexOf('addEventListener'));
      const body = endSection > 0 ? resumeSection.slice(0, endSection + 3) : resumeSection.slice(0, 600);
      expect(body).toContain('showStarfield');
    });
  });

  // === Todo 23: Focus mode slow auto-rotation ===
  describe('Focus mode auto-rotation', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has a startAutoRotation function', () => {
      expect(page).toContain('startAutoRotation');
    });

    it('has a stopAutoRotation function', () => {
      expect(page).toContain('stopAutoRotation');
    });

    it('auto-rotation uses requestAnimationFrame loop', () => {
      const section = page.slice(page.indexOf('startAutoRotation'));
      expect(section).toContain('requestAnimationFrame');
    });

    it('auto-rotation increments rotationAngle', () => {
      const section = page.slice(page.indexOf('startAutoRotation'));
      expect(section).toContain('rotationAngle');
    });

    it('startAutoRotation is called from showStarfield', () => {
      const section = page.slice(page.indexOf('function showStarfield'));
      const nextFn = section.indexOf('\n  function ', 10);
      const body = nextFn > 0 ? section.slice(0, nextFn) : section.slice(0, 500);
      expect(body).toContain('startAutoRotation');
    });
  });

  // === Todo 24: Break mode dawn ambiance ===
  describe('Break mode dawn ambiance', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has a dawnAmount variable for controlling ambiance', () => {
      expect(page).toContain('dawnAmount');
    });

    it('uses gsap to transition dawnAmount when entering break mode', () => {
      const breakClickSection = page.slice(page.indexOf('breakBtn.addEventListener'));
      const endIdx = breakClickSection.indexOf('\n  //', 10);
      const body = endIdx > 0 ? breakClickSection.slice(0, endIdx) : breakClickSection.slice(0, 800);
      expect(body).toContain('dawnAmount');
    });

    it('transitions dawnAmount back to 0 when returning to focus mode', () => {
      const breakClickSection = page.slice(page.indexOf('breakBtn.addEventListener'));
      const body = breakClickSection.slice(0, 800);
      // Should animate dawnAmount to 0 for focus
      expect(body).toMatch(/dawnAmount.*0|dawnAmount.*focus/);
    });

    it('renderField uses dawnAmount to adjust background color', () => {
      const renderSection = page.slice(page.indexOf('function renderField'));
      const nextFn = renderSection.indexOf('\n  function ', 10);
      const body = nextFn > 0 ? renderSection.slice(0, nextFn) : renderSection.slice(0, 500);
      expect(body).toContain('dawnAmount');
    });

    it('ring color shifts for break mode (uses BREAK_COLOR)', () => {
      const breakClickSection = page.slice(page.indexOf('breakBtn.addEventListener'));
      expect(breakClickSection).toContain('BREAK_COLOR');
    });
  });

  // === Todo 25: Break mode click-and-drag rotation ===
  describe('Break mode click-and-drag rotation', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has mousedown event listener on the canvas', () => {
      expect(page).toMatch(/starfieldCanvas.*addEventListener.*mousedown|addEventListener.*mousedown/);
    });

    it('has mousemove event listener for drag rotation', () => {
      expect(page).toContain('mousemove');
    });

    it('has mouseup event listener to stop dragging', () => {
      expect(page).toContain('mouseup');
    });

    it('drag only works in break mode', () => {
      // The mousedown/mousemove handler should check mode === 'break'
      expect(page).toMatch(/mode\s*===?\s*'break'/);
    });

    it('drag updates rotationAngle based on mouse movement', () => {
      // Find the drag mousemove handler (window.addEventListener mousemove with isDragging)
      const dragSection = page.slice(page.indexOf('Mouse drag rotation'));
      const body = dragSection.slice(0, 800);
      expect(body).toContain('rotationAngle');
    });

    it('stops auto-rotation during break mode', () => {
      // When entering break mode, auto-rotation should stop to allow drag
      const breakClickSection = page.slice(page.indexOf('breakBtn.addEventListener'));
      const body = breakClickSection.slice(0, 1500);
      expect(body).toContain('stopAutoRotation');
    });

    it('restarts auto-rotation when returning to focus mode', () => {
      const breakClickSection = page.slice(page.indexOf('breakBtn.addEventListener'));
      const body = breakClickSection.slice(0, 1500);
      expect(body).toContain('startAutoRotation');
    });
  });

  // === Todo 26: Mobile touch-drag support ===
  describe('Mobile touch-drag support', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has touchstart event listener on the canvas', () => {
      expect(page).toContain('touchstart');
    });

    it('has touchmove event listener for drag rotation', () => {
      expect(page).toContain('touchmove');
    });

    it('has touchend event listener to stop dragging', () => {
      expect(page).toContain('touchend');
    });

    it('touch drag updates rotationAngle', () => {
      const touchSection = page.slice(page.indexOf('touchmove'));
      expect(touchSection).toContain('rotationAngle');
    });

    it('touch events only work in break mode', () => {
      const touchSection = page.slice(page.indexOf('touchstart'));
      const body = touchSection.slice(0, 300);
      expect(body).toMatch(/mode\s*!==?\s*'break'|mode\s*===?\s*'break'/);
    });
  });

  // === Todo 28-29: Stereographic projection + spherical coordinates ===
  describe('Stereographic projection with spherical coordinates', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has a stereographic projection function', () => {
      expect(page).toMatch(/stereographic|stereoProject/);
    });

    it('constellation star data uses ra (right ascension) in radians', () => {
      expect(page).toMatch(/ra\s*:/);
    });

    it('constellation star data uses dec (declination) in radians', () => {
      expect(page).toMatch(/dec\s*:/);
    });

    it('no longer uses flat x/y coordinates for stars', () => {
      // Old format was { x: number, y: number, mag: number }
      // The Star interface should now use ra/dec, not x/y
      const starInterface = page.match(/interface Star\s*\{[^}]+\}/);
      expect(starInterface).not.toBeNull();
      expect(starInterface![0]).toContain('ra');
      expect(starInterface![0]).toContain('dec');
      expect(starInterface![0]).not.toContain('x:');
      expect(starInterface![0]).not.toContain('y:');
    });

    it('Polaris is defined as the projection center', () => {
      expect(page).toMatch(/[Pp]olaris|POLARIS/);
    });

    it('projection references Polaris declination (~90°)', () => {
      // Polaris dec is ~89.26° ≈ 1.558 radians
      expect(page).toMatch(/1\.55[0-9]|Math\.PI\s*\/\s*2/);
    });
  });

  // === Todo 30: Canvas viewport into larger virtual sky ===
  describe('Canvas as viewport into virtual sky', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('uses a fixed pixel scale (not dependent on canvas dimensions)', () => {
      expect(page).toMatch(/SCALE|pixelScale|PIXEL_SCALE/);
    });

    it('projects stars relative to canvas center (viewport center)', () => {
      const projFn = page.slice(page.indexOf('stereoProject') > -1 ? page.indexOf('stereoProject') : page.indexOf('stereographic'));
      expect(projFn).toMatch(/width\s*\/\s*2|w\s*\/\s*2|cx|centerX/);
    });

    it('resize does not stretch — same scale, just more visible sky', () => {
      // resizeCanvas should set canvas size but NOT change the SCALE constant
      const resizeSection = page.slice(page.indexOf('function resizeCanvas'));
      const nextFn = resizeSection.indexOf('\n  function ', 10);
      const body = nextFn > 0 ? resizeSection.slice(0, nextFn) : resizeSection.slice(0, 300);
      expect(body).not.toMatch(/SCALE|pixelScale|PIXEL_SCALE/);
    });
  });

  // === Todo 31: Rotation pivots around Polaris ===
  describe('Rotation around Polaris', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('rotationAngle is applied as RA offset in the projection', () => {
      const projFn = page.slice(page.indexOf('stereoProject') > -1 ? page.indexOf('stereoProject') : page.indexOf('stereographic'));
      const body = projFn.slice(0, 600);
      expect(body).toContain('rotationAngle');
    });

    it('background stars also use the stereographic projection', () => {
      const drawSection = page.slice(page.indexOf('drawStars'));
      const body = drawSection.slice(0, 800);
      expect(body).toMatch(/stereoProject|stereographic/);
    });
  });

  // === Todo 32: Slower auto-rotation ===
  describe('Slower auto-rotation speed', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('rotation speed is slower than 0.00005', () => {
      const match = page.match(/ROTATION_SPEED\s*=\s*([\d.]+)/);
      expect(match).not.toBeNull();
      const speed = parseFloat(match![1]);
      expect(speed).toBeLessThan(0.00005);
    });
  });

  // === Todo 33: Constellation names on hover ===
  describe('Constellation name hover labels', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has a mousemove listener that checks constellation proximity', () => {
      // The hover mousemove handler section should reference CONSTELLATIONS and hoveredConstellation
      expect(page).toContain('hoveredConstellation');
      expect(page).toContain('HOVER_RADIUS');
    });

    it('draws constellation name text on canvas', () => {
      expect(page).toContain('fillText');
    });

    it('has a hover radius or distance threshold for showing labels', () => {
      expect(page).toMatch(/HOVER_RADIUS|hoverRadius|HOVER_DIST|hoverDist|LABEL_DIST/i);
    });
  });

  // === Todo 34: Pointer-events fix for break mode ===
  describe('Pointer-events fix for break mode drag', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('sets pointer-events via mainContent during mode switch', () => {
      expect(page).toContain('mainContent.style.pointerEvents');
    });

    it('disables main pointer-events during break so canvas receives clicks', () => {
      const breakBtnSection = page.slice(page.indexOf('breakBtn.addEventListener'));
      const body = breakBtnSection.slice(0, 1500);
      expect(body).toContain("mainContent.style.pointerEvents = 'none'");
    });

    it('restores main pointer-events when returning to focus', () => {
      const breakBtnSection = page.slice(page.indexOf('breakBtn.addEventListener'));
      const body = breakBtnSection.slice(0, 1500);
      // pointerEvents reset to empty string (restores CSS default)
      expect(body).toMatch(/mainContent\.style\.pointerEvents\s*=\s*['"]['"]|mainContent\.style\.pointerEvents\s*=\s*''/);
    });

    it('timer-container has pointer-events-auto so controls remain clickable', () => {
      const containerIdx = page.indexOf('id="timer-container"');
      const surrounding = page.slice(Math.max(0, containerIdx - 100), containerIdx + 300);
      expect(surrounding).toContain('pointer-events-auto');
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
