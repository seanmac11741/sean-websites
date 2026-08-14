/**
 * Sky ambiance for the flowstate timer.
 *
 * The star field has two moods: night while focusing, dawn while on a break.
 * "What night looks like" and "what dawn looks like" are each stated once here,
 * so the two transitions are mirror images of one another.
 *
 * The controller is pure: every side effect (painting the canvas, running the
 * auto-rotation loop, tweening a number over time, handing pointer events to the
 * canvas) is injected, so the page owns canvas/gsap and this module owns the rules.
 */

/** Fully dark sky — focus mode. */
export const NIGHT = 0;
/** Fully lit sky — break mode. */
export const DAWN = 1;

const NIGHT_RGB = [10, 10, 15] as const;
const DAWN_RGB = [35, 30, 50] as const;
const DAWN_STAR_FADE = 0.4;

/** Background colour of the sky at a given dawn amount (0 = night, 1 = dawn). */
export function skyColor(dawnAmount: number): string {
  const [r, g, b] = NIGHT_RGB.map((from, i) =>
    Math.round(from + dawnAmount * (DAWN_RGB[i] - from)),
  );
  return `rgb(${r}, ${g}, ${b})`;
}

/** Opacity stars and constellation lines are drawn at, at a given dawn amount. */
export function starAlpha(dawnAmount: number): number {
  return 1 - dawnAmount * DAWN_STAR_FADE;
}

export interface AmbianceEffects {
  /** Repaint the star field using the controller's current amount. */
  render(): void;
  /** Begin the slow automatic sky rotation. Idempotent. */
  startRotation(): void;
  /** Halt the automatic sky rotation. */
  stopRotation(): void;
  /** true = the canvas takes pointer events (drag the sky); false = the page does. */
  setSkyInteractive(interactive: boolean): void;
  /**
   * Tween a value from `from` to `to`, calling `onUpdate` on every frame.
   * Must cancel any tween it already has in flight, so a fast break↔focus
   * toggle cannot leave two of them fighting over the sky.
   */
  animate(from: number, to: number, onUpdate: (value: number) => void): void;
}

export interface AmbianceOptions {
  /** false applies the mode in one step, with no tween. Defaults to true. */
  animated?: boolean;
}

export interface Ambiance {
  /** How lit the sky currently is, between NIGHT and DAWN. */
  readonly dawnAmount: number;
  /** Move the sky to night and give the page back its pointer events. */
  toFocus(options?: AmbianceOptions): void;
  /** Move the sky to dawn and let the viewer drag it. */
  toBreak(options?: AmbianceOptions): void;
}

export function createAmbiance(effects: AmbianceEffects): Ambiance {
  let dawnAmount: number = NIGHT;

  function transition(target: number, { animated = true }: AmbianceOptions) {
    if (!animated) {
      dawnAmount = target;
      effects.render();
      return;
    }
    effects.animate(dawnAmount, target, (value) => {
      dawnAmount = value;
      effects.render();
    });
  }

  return {
    get dawnAmount() {
      return dawnAmount;
    },

    // Both modes settle the same way: pointer events, then rotation, then the
    // sky itself. Rotation is resumed before the focus transition rather than
    // after it, so the sky keeps drifting while it darkens.
    toFocus(options = {}) {
      effects.setSkyInteractive(false);
      effects.startRotation();
      transition(NIGHT, options);
    },

    toBreak(options = {}) {
      effects.setSkyInteractive(true);
      effects.stopRotation();
      transition(DAWN, options);
    },
  };
}
