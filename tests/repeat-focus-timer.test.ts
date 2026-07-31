import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const page = readFileSync('src/pages/tools/flowstate-timer.astro', 'utf-8');

describe('Repeatable focus timer', () => {
  it('offers a dedicated repeat-focus control after focus completes', () => {
    expect(page).toContain('id="repeat-focus-btn"');
    expect(page).toContain('Repeat Focus');
  });

  it('styles repeat focus as the primary post-focus action', () => {
    const repeatMarkup = page.slice(page.indexOf('id="repeat-focus-btn"'), page.indexOf('</button>', page.indexOf('id="repeat-focus-btn"')));
    const breakMarkup = page.slice(page.indexOf('id="break-btn"'), page.indexOf('</button>', page.indexOf('id="break-btn"')));
    expect(repeatMarkup).toContain('bg-accent');
    expect(repeatMarkup).toContain('shadow-accent/25');
    expect(breakMarkup).toContain('border-white/20');
    expect(breakMarkup).not.toContain('bg-accent');
  });

  it('keeps the break action and break-duration choices available', () => {
    expect(page).toContain('id="break-btn"');
    expect(page).toContain('Take a Break');
    expect(page).toContain('data-break-minutes="5"');
    expect(page).toContain('data-break-minutes="15"');
    expect(page).toContain('data-break-minutes="30"');
  });

  it('shows repeat only after focus and hides it after break', () => {
    const transition = page.slice(page.indexOf('function onAlarmDismissed'), page.indexOf('// === Break/Focus button'));
    expect(transition).toContain("repeatFocusBtn.classList.remove('hidden')");
    expect(transition).toContain("repeatFocusBtn.classList.add('hidden')");
    expect(transition).toContain("breakBtn.textContent = 'Start Focus'");
  });

  it('preserves the exact duration when a focus timer completes', () => {
    expect(page).toContain('let completedFocusSeconds');
    const completion = page.slice(page.indexOf('function onTimerComplete'), page.indexOf('// === Dismiss alarm'));
    expect(completion).toContain("if (mode === 'focus')");
    expect(completion).toContain('completedFocusSeconds = totalSeconds');
  });

  it('starts repeat focus from the preserved completed duration', () => {
    expect(page).toContain('function startTimer(durationSeconds');
    const repeatHandler = page.slice(page.indexOf("repeatFocusBtn.addEventListener('click'"), page.indexOf('// === Break/Focus button'));
    expect(repeatHandler).toContain('startTimer(completedFocusSeconds)');
    expect(repeatHandler).not.toContain('90');
  });

  it('does not add a 15-minute focus preset', () => {
    const focusPresets = page.slice(page.indexOf('id="focus-presets"'), page.indexOf('id="initial-break-presets"'));
    expect(focusPresets).not.toContain('data-minutes="15"');
    expect(focusPresets).toContain('data-minutes="25"');
    expect(page).toContain('id="custom-minutes"');
  });

  it('explicitly keeps repeated sessions in focus mode', () => {
    const repeatHandler = page.slice(page.indexOf("repeatFocusBtn.addEventListener('click'"), page.indexOf('// === Break/Focus button'));
    expect(repeatHandler).toContain("mode = 'focus'");
    expect(repeatHandler).not.toContain("mode = 'break'");
  });

  it('uses the indigo focus ring for repeated focus', () => {
    const startTimer = page.slice(page.indexOf('function startTimer'), page.indexOf("startBtn.addEventListener"));
    expect(startTimer).toContain("mode === 'break' ? BREAK_COLOR : FOCUS_COLOR");
    expect(page).toContain("const FOCUS_COLOR = '#818CF8'");
  });

  it('restores night ambiance and auto-rotation when repeating focus', () => {
    const repeatHandler = page.slice(page.indexOf("repeatFocusBtn.addEventListener('click'"), page.indexOf('// === Break/Focus button'));
    expect(repeatHandler).toContain('setFocusAmbiance()');
    const focusAmbiance = page.slice(page.indexOf('function setFocusAmbiance'), page.indexOf('function setBreakAmbiance'));
    expect(focusAmbiance).toContain('dawnAmount = 0');
    expect(focusAmbiance).toContain('startAutoRotation()');
  });

  it('disables break-only drag and pointer overrides for repeat focus', () => {
    const focusAmbiance = page.slice(page.indexOf('function setFocusAmbiance'), page.indexOf('function setBreakAmbiance'));
    expect(focusAmbiance).toContain("mainContent.style.pointerEvents = ''");
    expect(focusAmbiance).toContain("starfieldCanvas.style.pointerEvents = ''");
    expect(focusAmbiance).toContain("starfieldCanvas.style.cursor = 'default'");
    expect(focusAmbiance).toContain('isDragging = false');
  });

  it('keeps break styling, dawn ambiance, and drag behavior', () => {
    const breakHandler = page.slice(page.indexOf("breakBtn.addEventListener('click'"), page.indexOf('// === Check for saved state'));
    expect(breakHandler).toContain("mode = 'break'");
    expect(breakHandler).toContain('BREAK_COLOR');
    expect(breakHandler).toContain('dawnAmount');
    expect(breakHandler).toContain('stopAutoRotation()');
    expect(breakHandler).toContain("starfieldCanvas.style.cursor = 'grab'");
  });

  it('persists a repeated focus timer as soon as it starts', () => {
    const startTimer = page.slice(page.indexOf('function startTimer'), page.indexOf("startBtn.addEventListener"));
    expect(startTimer).toContain('saveState()');
    const savePosition = startTimer.indexOf('saveState()');
    expect(savePosition).toBeGreaterThan(startTimer.indexOf('remainingSeconds = totalSeconds'));
  });

  it('uses the normal pause and resume controls for repeated focus', () => {
    const pauseHandler = page.slice(page.indexOf("pauseBtn.addEventListener('click'"), page.indexOf('// === Reset'));
    expect(pauseHandler).toContain('isPaused = true');
    expect(pauseHandler).toContain('cancelAnimationFrame');
    expect(pauseHandler).toContain('isPaused = false');
    expect(pauseHandler).toContain('requestAnimationFrame(tick)');
  });

  it('uses reset to return repeated focus to presets and clear persistence', () => {
    const resetHandler = page.slice(page.indexOf("resetBtn.addEventListener('click'"), page.indexOf('// === Web Audio'));
    expect(resetHandler).toContain("timerDisplayContainer.classList.add('hidden')");
    expect(resetHandler).toContain("presetsContainer.classList.remove('hidden')");
    expect(resetHandler).toContain('clearSavedState()');
    expect(resetHandler).toContain("pauseBtn.textContent = 'Pause'");
  });

  it('clears completed state centrally before transition choices', () => {
    const completion = page.slice(page.indexOf('function onTimerComplete'), page.indexOf('// === Dismiss alarm'));
    expect(completion).toContain('clearSavedState()');
    expect(completion.indexOf('clearSavedState()')).toBeLessThan(completion.indexOf('startAlarm()'));
  });
});
