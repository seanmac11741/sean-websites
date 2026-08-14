import { describe, expect, it } from 'vitest';
import {
  DAWN,
  NIGHT,
  createAmbiance,
  skyColor,
  starAlpha,
  type AmbianceEffects,
} from '../../src/lib/flowstate/ambiance';

/**
 * Records every effect the controller asks for, and lets a test drive the
 * animation frame by frame the way gsap would.
 */
function spyEffects() {
  const calls: string[] = [];
  let pending: ((v: number) => void) | null = null;

  const effects: AmbianceEffects = {
    render: () => calls.push('render'),
    startRotation: () => calls.push('startRotation'),
    stopRotation: () => calls.push('stopRotation'),
    setSkyInteractive: (on) => calls.push(`setSkyInteractive:${on}`),
    animate: (from, to, onUpdate) => {
      calls.push(`animate:${from}->${to}`);
      pending = onUpdate;
    },
  };

  return {
    effects,
    calls,
    /** Play the in-flight animation through the given intermediate values. */
    play(...values: number[]) {
      if (!pending) throw new Error('no animation in flight');
      for (const v of values) pending(v);
    },
    get animating() {
      return pending !== null;
    },
  };
}

describe('skyColor', () => {
  it('is near-black at night', () => {
    expect(skyColor(NIGHT)).toBe('rgb(10, 10, 15)');
  });

  it('lightens toward dawn', () => {
    expect(skyColor(DAWN)).toBe('rgb(35, 30, 50)');
  });

  it('interpolates across the transition', () => {
    expect(skyColor(0.5)).toBe('rgb(23, 20, 33)');
  });
});

describe('starAlpha', () => {
  it('shows stars at full strength at night', () => {
    expect(starAlpha(NIGHT)).toBe(1);
  });

  it('fades stars at dawn', () => {
    expect(starAlpha(DAWN)).toBeCloseTo(0.6);
  });
});

describe('createAmbiance', () => {
  it('starts at night', () => {
    const spy = spyEffects();
    expect(createAmbiance(spy.effects).dawnAmount).toBe(NIGHT);
  });

  it('repaints on every frame of the transition into break', () => {
    const spy = spyEffects();
    const ambiance = createAmbiance(spy.effects);
    spy.calls.length = 0;

    ambiance.toBreak();
    expect(spy.calls).toContain('animate:0->1');

    spy.play(0.25, 0.5, 1);
    expect(spy.calls.filter((c) => c === 'render')).toHaveLength(3);
    expect(ambiance.dawnAmount).toBe(DAWN);
  });

  it('repaints on every frame of the transition back to focus', () => {
    const spy = spyEffects();
    const ambiance = createAmbiance(spy.effects);
    ambiance.toBreak({ animated: false });
    spy.calls.length = 0;

    ambiance.toFocus();
    expect(spy.calls).toContain('animate:1->0');

    spy.play(0.75, 0.5, 0);
    expect(spy.calls.filter((c) => c === 'render')).toHaveLength(3);
    expect(ambiance.dawnAmount).toBe(NIGHT);
  });

  it('stops auto-rotation on entering break and restarts it on returning to focus', () => {
    const spy = spyEffects();
    const ambiance = createAmbiance(spy.effects);

    ambiance.toBreak();
    expect(spy.calls).toContain('stopRotation');
    expect(spy.calls).not.toContain('startRotation');

    spy.calls.length = 0;
    ambiance.toFocus();
    expect(spy.calls).toContain('startRotation');
    expect(spy.calls).not.toContain('stopRotation');
  });

  it('hands pointer events to the sky in break and back to the page in focus', () => {
    const spy = spyEffects();
    const ambiance = createAmbiance(spy.effects);

    ambiance.toBreak();
    expect(spy.calls).toContain('setSkyInteractive:true');

    spy.calls.length = 0;
    ambiance.toFocus();
    expect(spy.calls).toContain('setSkyInteractive:false');
  });

  it('applies each mode immediately when not animated', () => {
    const spy = spyEffects();
    const ambiance = createAmbiance(spy.effects);

    ambiance.toBreak({ animated: false });
    expect(spy.animating).toBe(false);
    expect(ambiance.dawnAmount).toBe(DAWN);
    expect(spy.calls).toContain('render');

    spy.calls.length = 0;
    ambiance.toFocus({ animated: false });
    expect(spy.animating).toBe(false);
    expect(ambiance.dawnAmount).toBe(NIGHT);
    expect(spy.calls).toContain('render');
  });

  it('animates from wherever the sky currently is', () => {
    const spy = spyEffects();
    const ambiance = createAmbiance(spy.effects);

    ambiance.toBreak();
    spy.play(0.4);
    spy.calls.length = 0;

    ambiance.toFocus();
    expect(spy.calls).toContain('animate:0.4->0');
  });
});
