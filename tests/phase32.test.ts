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
  // What a Session is, how its Deadline yields the time left, and which Effects
  // each transition produces all live in src/lib/timer/session.ts and are
  // covered by tests/lib/timer.test.ts. All this page owes is the wiring a pure
  // test cannot see: that it imports the Session module and drives it.
  describe('Session module wiring', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('imports the Session module and drives the page through it', () => {
      expect(page).toContain("from '../../lib/timer/session'");
      expect(page).toContain('reduce(session, event)');
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

  // === Todo 13-14: Transition and break-choice markup ===
  // Which of these the page shows, and when, is a Session rule — see
  // tests/lib/timer.test.ts. What survives here is the markup itself.
  describe('Transition and break-choice markup', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('has a transition container for phrases and the next-mode button', () => {
      expect(page).toContain('id="transition-container"');
      expect(page).toContain('id="phrase-display"');
      expect(page).toContain('id="break-btn"');
      expect(page).toContain('Take a Break');
    });

    it('transition container is hidden initially', () => {
      const idx = page.indexOf('id="transition-container"');
      const surrounding = page.slice(Math.max(0, idx - 200), idx + 100);
      expect(surrounding).toContain('hidden');
    });

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

    it('has a break ring color distinct from the focus accent', () => {
      expect(page).toMatch(/#(2dd4bf|34d399|4ade80|10b981)/);
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

    it('has Focus/Break mode toggle buttons on preset screen', () => {
      expect(page).toContain('id="mode-toggle-focus"');
      expect(page).toContain('id="mode-toggle-break"');
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

    // That starting or resuming a Session shows the star field is an Effect of
    // those transitions — asserted in tests/lib/timer.test.ts. The page only
    // performs the Effect, which the wiring assertion above already covers.

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

    // Resuming a restored Session shows the star field too — that it does so is
    // an Effect of the resume transition, asserted in tests/lib/timer.test.ts.
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
  // The ambiance rules themselves live in src/lib/flowstate/ambiance.ts and are
  // covered by tests/lib/flowstate-ambiance.test.ts. All this page owes is the
  // wiring a pure test cannot see: that it imports and drives that module.
  describe('Break mode dawn ambiance', () => {
    const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

    it('drives both mode switches through the shared ambiance module', () => {
      expect(page).toContain("from '../../lib/flowstate/ambiance'");
      const breakHandler = page.slice(page.indexOf('breakBtn.addEventListener'));
      const body = breakHandler.slice(0, breakHandler.indexOf("dispatch({ type: 'start'"));
      expect(body).toContain('ambiance.toBreak()');
      expect(body).toContain('ambiance.toFocus()');
    });

    it('has a break ring color distinct from the focus accent', () => {
      expect(page).toContain('BREAK_COLOR');
      expect(page).toContain('FOCUS_COLOR');
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

    // Stopping rotation on break and restarting it on focus is a rule of the
    // ambiance module — see tests/lib/flowstate-ambiance.test.ts.
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

    it('hands pointer events between the page and the canvas', () => {
      // Which mode gets pointer events is an ambiance-module rule; the page owns
      // only the DOM writes, and it makes them in exactly one place.
      expect(page).toContain("mainContent.style.pointerEvents = 'none'");
      expect(page).toContain("mainContent.style.pointerEvents = ''");
      expect(page.match(/mainContent\.style\.pointerEvents/g)).toHaveLength(2);
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
