import { describe, expect, it } from 'vitest';
import {
  BREAK_PHRASES,
  canResume,
  DEFAULT_BREAK_MINUTES,
  DEFAULT_FOCUS_MINUTES,
  FOCUS_PHRASES,
  MAX_MINUTES,
  RESUME_WINDOW_MS,
  formatTime,
  initialSession,
  modeLabel,
  nextStart,
  reduce,
  remainingAt,
  resumeMessage,
  ringFraction,
  screen,
  toSaved,
  transitionView,
  wakeDelay,
  type Event,
  type Session,
} from '../../src/lib/timer/session';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;

/** Run a series of events from a starting Session, returning the final Session. */
function run(session: Session, ...events: Event[]): Session {
  return events.reduce((s, event) => reduce(s, event).session, session);
}

/** A running focus Session of `minutes`, started at T0. */
function running(minutes = DEFAULT_FOCUS_MINUTES): Session {
  return run(initialSession(), { type: 'start', mode: 'focus', minutes, now: T0 });
}

describe('Session', () => {
  describe('initial Session', () => {
    it('is idle, in focus mode, at the default focus duration', () => {
      const session = initialSession();
      expect(session.status).toBe('idle');
      expect(session.mode).toBe('focus');
      expect(session.totalSeconds).toBe(DEFAULT_FOCUS_MINUTES * 60);
      expect(session.remainingSeconds).toBe(DEFAULT_FOCUS_MINUTES * 60);
      expect(session.endsAt).toBeNull();
      expect(session.phrase).toBeNull();
    });

    it('remembers the default focus and break durations', () => {
      const session = initialSession();
      expect(session.lastFocusSeconds).toBe(DEFAULT_FOCUS_MINUTES * 60);
      expect(session.breakSeconds).toBe(DEFAULT_BREAK_MINUTES * 60);
    });
  });

  describe('start', () => {
    it('sets a Deadline one duration ahead of now', () => {
      const session = running(25);
      expect(session.status).toBe('running');
      expect(session.totalSeconds).toBe(25 * 60);
      expect(session.endsAt).toBe(T0 + 25 * MINUTE);
      expect(session.remainingSeconds).toBe(25 * 60);
    });

    it('starts a break Session in break mode', () => {
      const session = run(initialSession(), { type: 'start', mode: 'break', minutes: 15, now: T0 });
      expect(session.mode).toBe('break');
      expect(session.totalSeconds).toBe(15 * 60);
    });

    it('clamps the duration to the allowed range', () => {
      const tooLong = run(initialSession(), { type: 'start', mode: 'focus', minutes: 9999, now: T0 });
      expect(tooLong.totalSeconds).toBe(MAX_MINUTES * 60);

      const tooShort = run(initialSession(), { type: 'start', mode: 'focus', minutes: 0, now: T0 });
      expect(tooShort.totalSeconds).toBe(60);
    });

    it('clears any phrase left over from a transition', () => {
      const transition = run(
        running(1),
        { type: 'tick', now: T0 + MINUTE },
        { type: 'dismiss', draw: 0 },
      );
      expect(transition.phrase).not.toBeNull();

      const restarted = run(transition, { type: 'start', mode: 'break', minutes: 5, now: T0 });
      expect(restarted.phrase).toBeNull();
    });

    it('shows the star field, plays the entrance and saves', () => {
      const { effects } = reduce(initialSession(), {
        type: 'start',
        mode: 'focus',
        minutes: 90,
        now: T0,
      });
      expect(effects).toEqual(['showStarfield', 'playEntrance', 'save']);
    });

    it('remembers a chosen focus duration as soon as the Session starts', () => {
      expect(running(45).lastFocusSeconds).toBe(45 * 60);
    });

    it('remembers the clamped duration, not the one asked for', () => {
      expect(running(9999).lastFocusSeconds).toBe(MAX_MINUTES * 60);
    });

    it('leaves the remembered focus duration alone when a break starts', () => {
      const afterBreakStart = run(running(45), {
        type: 'start',
        mode: 'break',
        minutes: 5,
        now: T0,
      });
      expect(afterBreakStart.lastFocusSeconds).toBe(45 * 60);
    });
  });

  describe('carrying a chosen focus duration across a break', () => {
    /** A custom focus, run to completion, then a break run to completion. */
    function afterCustomFocusAndBreak(focusMinutes: number): Session {
      return run(
        running(focusMinutes),
        { type: 'tick', now: T0 + focusMinutes * MINUTE },
        { type: 'dismiss', draw: 0 },
        { type: 'start', mode: 'break', minutes: 5, now: T0 },
        { type: 'tick', now: T0 + 5 * MINUTE },
        { type: 'dismiss', draw: 0 },
      );
    }

    it('starts the post-break focus at the duration last chosen', () => {
      const transition = afterCustomFocusAndBreak(45);
      const next = nextStart(transition);
      const focus = run(transition, { type: 'start', ...next, now: T0 });
      expect(focus.mode).toBe('focus');
      expect(focus.totalSeconds).toBe(45 * 60);
    });

    it('starts Repeat Focus at that same duration', () => {
      const transition = run(
        running(45),
        { type: 'tick', now: T0 + 45 * MINUTE },
        { type: 'dismiss', draw: 0 },
      );
      expect(run(transition, { type: 'repeatFocus', now: T0 }).totalSeconds).toBe(45 * 60);
    });

    it('takes a newly chosen duration over the remembered one', () => {
      const transition = afterCustomFocusAndBreak(45);
      const focus = run(transition, { type: 'start', mode: 'focus', minutes: 20, now: T0 });
      expect(focus.totalSeconds).toBe(20 * 60);
      expect(focus.lastFocusSeconds).toBe(20 * 60);
    });
  });

  describe('tick', () => {
    it('derives the remaining time from the Deadline', () => {
      const session = run(running(90), { type: 'tick', now: T0 + 30 * MINUTE });
      expect(session.remainingSeconds).toBe(60 * 60);
      expect(session.status).toBe('running');
    });

    it('jumps forward correctly after a hidden tab stalls the ticks', () => {
      const session = run(
        running(90),
        { type: 'tick', now: T0 + 1000 },
        // …tab hidden for an hour, no ticks at all…
        { type: 'tick', now: T0 + 60 * MINUTE },
      );
      expect(session.remainingSeconds).toBe(30 * 60);
    });

    it('completes when a tick arrives long after the Deadline, rather than drifting', () => {
      const { session, effects } = reduce(running(20), { type: 'tick', now: T0 + 60 * MINUTE });
      expect(session.status).toBe('ringing');
      expect(session.remainingSeconds).toBe(0);
      expect(session.endsAt).toBeNull();
      expect(effects).toEqual(['clearSaved', 'startAlarm', 'pulseRing']);
    });

    it('completes exactly at the Deadline', () => {
      const session = run(running(20), { type: 'tick', now: T0 + 20 * MINUTE });
      expect(session.status).toBe('ringing');
    });

    it('produces no Effects while the Session is still running', () => {
      const { effects } = reduce(running(90), { type: 'tick', now: T0 + 1000 });
      expect(effects).toEqual([]);
    });

    it('remembers the duration of a completed focus Session', () => {
      const session = run(running(45), { type: 'tick', now: T0 + 45 * MINUTE });
      expect(session.lastFocusSeconds).toBe(45 * 60);
    });

    it('leaves the remembered focus duration alone when a break completes', () => {
      const afterFocus = run(running(45), { type: 'tick', now: T0 + 45 * MINUTE });
      const afterBreak = run(
        afterFocus,
        { type: 'dismiss', draw: 0 },
        { type: 'start', mode: 'break', minutes: 5, now: T0 },
        { type: 'tick', now: T0 + 5 * MINUTE },
      );
      expect(afterBreak.lastFocusSeconds).toBe(45 * 60);
    });

    it('is ignored when the Session is not running', () => {
      const idle = initialSession();
      const { session, effects } = reduce(idle, { type: 'tick', now: T0 + 60 * MINUTE });
      expect(session).toEqual(idle);
      expect(effects).toEqual([]);
    });
  });

  describe('pause and resume', () => {
    it('pause freezes the remaining time and drops the Deadline', () => {
      const { session, effects } = reduce(running(90), { type: 'pause', now: T0 + 10 * MINUTE });
      expect(session.status).toBe('paused');
      expect(session.remainingSeconds).toBe(80 * 60);
      expect(session.endsAt).toBeNull();
      expect(effects).toEqual(['save']);
    });

    it('a paused Session does not lose time while it is paused', () => {
      const paused = run(running(90), { type: 'pause', now: T0 + 10 * MINUTE });
      expect(remainingAt(paused, T0 + 400 * MINUTE)).toBe(80 * 60);
    });

    it('resume sets a fresh Deadline from the moment of resuming', () => {
      const paused = run(running(90), { type: 'pause', now: T0 + 10 * MINUTE });
      const { session, effects } = reduce(paused, { type: 'resume', now: T0 + 400 * MINUTE });
      expect(session.status).toBe('running');
      expect(session.endsAt).toBe(T0 + 400 * MINUTE + 80 * MINUTE);
      expect(effects).toEqual(['showStarfield', 'save']);
    });

    it('ignores pause unless running, and resume unless paused', () => {
      const session = running(90);
      expect(reduce(session, { type: 'resume', now: T0 }).session).toEqual(session);
      const idle = initialSession();
      expect(reduce(idle, { type: 'pause', now: T0 }).session).toEqual(idle);
    });
  });

  describe('reset', () => {
    it('returns a running Session to idle at its full duration and clears the save', () => {
      const { session, effects } = reduce(
        run(running(25), { type: 'tick', now: T0 + 10 * MINUTE }),
        { type: 'reset' },
      );
      expect(session.status).toBe('idle');
      expect(session.remainingSeconds).toBe(25 * 60);
      expect(session.endsAt).toBeNull();
      expect(effects).toEqual(['clearSaved']);
    });

    it('silences a ringing alarm', () => {
      const ringing = run(running(1), { type: 'tick', now: T0 + MINUTE });
      const { session, effects } = reduce(ringing, { type: 'reset' });
      expect(session.status).toBe('idle');
      expect(effects).toEqual(['stopAlarm', 'stopPulse', 'clearSaved']);
    });
  });

  describe('dismiss', () => {
    it('moves a ringing Session to the transition screen with a phrase', () => {
      const ringing = run(running(1), { type: 'tick', now: T0 + MINUTE });
      const { session, effects } = reduce(ringing, { type: 'dismiss', draw: 0 });
      expect(session.status).toBe('transition');
      expect(session.phrase).toBe(FOCUS_PHRASES[0]);
      expect(effects).toEqual(['stopAlarm', 'stopPulse']);
    });

    it('is ignored unless the alarm is ringing', () => {
      const session = running(90);
      expect(reduce(session, { type: 'dismiss', draw: 0 }).session).toEqual(session);
    });
  });

  describe('phrase selection', () => {
    function phraseFor(mode: 'focus' | 'break', draw: number): string | null {
      const ringing = run(
        initialSession(),
        { type: 'start', mode, minutes: 1, now: T0 },
        { type: 'tick', now: T0 + MINUTE },
      );
      return reduce(ringing, { type: 'dismiss', draw }).session.phrase;
    }

    it('picks the first phrase at a draw of 0', () => {
      expect(phraseFor('focus', 0)).toBe(FOCUS_PHRASES[0]);
      expect(phraseFor('break', 0)).toBe(BREAK_PHRASES[0]);
    });

    it('picks the last phrase at a draw of just under 1', () => {
      expect(phraseFor('focus', 0.999999)).toBe(FOCUS_PHRASES[FOCUS_PHRASES.length - 1]);
      expect(phraseFor('break', 0.999999)).toBe(BREAK_PHRASES[BREAK_PHRASES.length - 1]);
    });

    it('stays in range at a draw of exactly 1', () => {
      expect(phraseFor('focus', 1)).toBe(FOCUS_PHRASES[FOCUS_PHRASES.length - 1]);
    });

    it('a focus Session offers rest, a break Session offers work', () => {
      expect(FOCUS_PHRASES).toContain(phraseFor('focus', 0.5));
      expect(BREAK_PHRASES).toContain(phraseFor('break', 0.5));
    });
  });

  describe('break choice and repeat focus', () => {
    it('chooseBreak records the duration the next break will use', () => {
      const { session, effects } = reduce(initialSession(), { type: 'chooseBreak', minutes: 5 });
      expect(session.breakSeconds).toBe(5 * 60);
      expect(effects).toEqual([]);
      expect(nextStart(session)).toEqual({ mode: 'break', minutes: 5 });
    });

    it('repeatFocus starts a fresh focus Session at the remembered duration', () => {
      const transition = run(
        running(45),
        { type: 'tick', now: T0 + 45 * MINUTE },
        { type: 'dismiss', draw: 0 },
      );
      const { session, effects } = reduce(transition, { type: 'repeatFocus', now: T0 + 46 * MINUTE });
      expect(session.status).toBe('running');
      expect(session.mode).toBe('focus');
      expect(session.totalSeconds).toBe(45 * 60);
      expect(session.endsAt).toBe(T0 + 46 * MINUTE + 45 * MINUTE);
      expect(session.phrase).toBeNull();
      expect(effects).toEqual(['showStarfield', 'playEntrance', 'save']);
    });
  });

  describe('restore', () => {
    it('restores a running payload as paused, with the time actually left', () => {
      const saved = toSaved(running(90), T0);
      const { session, effects } = reduce(initialSession(), {
        type: 'restore',
        payload: saved,
        now: T0 + 30 * MINUTE,
      });
      expect(session.status).toBe('paused');
      expect(session.mode).toBe('focus');
      expect(session.totalSeconds).toBe(90 * 60);
      expect(session.remainingSeconds).toBe(60 * 60);
      expect(effects).toEqual([]);
    });

    it('restores a paused payload at the time it was paused with', () => {
      const paused = run(running(90), { type: 'pause', now: T0 + 10 * MINUTE });
      const { session } = reduce(initialSession(), {
        type: 'restore',
        payload: toSaved(paused, T0 + 10 * MINUTE),
        now: T0 + 30 * MINUTE,
      });
      expect(session.status).toBe('paused');
      expect(session.remainingSeconds).toBe(80 * 60);
    });

    it('carries the remembered focus and break durations back', () => {
      const withChoices = run(
        initialSession(),
        { type: 'chooseBreak', minutes: 5 },
        { type: 'start', mode: 'focus', minutes: 45, now: T0 },
        { type: 'tick', now: T0 + 45 * MINUTE },
        { type: 'dismiss', draw: 0 },
        { type: 'start', mode: 'break', minutes: 5, now: T0 + 46 * MINUTE },
      );
      const { session } = reduce(initialSession(), {
        type: 'restore',
        payload: toSaved(withChoices, T0 + 46 * MINUTE),
        now: T0 + 46 * MINUTE,
      });
      expect(session.lastFocusSeconds).toBe(45 * 60);
      expect(session.breakSeconds).toBe(5 * 60);
    });

    it('clamps a payload whose Deadline has just passed to zero', () => {
      const { session } = reduce(initialSession(), {
        type: 'restore',
        payload: toSaved(running(90), T0),
        now: T0 + 95 * MINUTE,
      });
      expect(session.status).toBe('paused');
      expect(session.remainingSeconds).toBe(0);
    });

    it('offers a payload whose Deadline passed exactly the resume window ago', () => {
      const { session, effects } = reduce(initialSession(), {
        type: 'restore',
        payload: toSaved(running(90), T0),
        now: T0 + 90 * MINUTE + RESUME_WINDOW_MS,
      });
      expect(session.status).toBe('paused');
      expect(effects).toEqual([]);
    });

    it('drops a payload whose Deadline passed more than the resume window ago', () => {
      const { session, effects } = reduce(initialSession(), {
        type: 'restore',
        payload: toSaved(running(90), T0),
        now: T0 + 90 * MINUTE + RESUME_WINDOW_MS + 1,
      });
      expect(session).toEqual(initialSession());
      expect(effects).toEqual(['clearSaved']);
    });

    it('ages a paused payload from when it was left, not from when it would have ended', () => {
      // Paused with 80 minutes on it, so its Deadline is still ahead at T0+80 —
      // but it has sat untouched for 70 minutes, and that is what makes it stale.
      const paused = run(running(90), { type: 'pause', now: T0 + 10 * MINUTE });
      const payload = toSaved(paused, T0 + 10 * MINUTE);

      const fresh = reduce(initialSession(), { type: 'restore', payload, now: T0 + 69 * MINUTE });
      expect(fresh.session.status).toBe('paused');

      const stale = reduce(initialSession(), { type: 'restore', payload, now: T0 + 71 * MINUTE });
      expect(stale.session).toEqual(initialSession());
      expect(stale.effects).toEqual(['clearSaved']);
    });

    it('drops a paused payload left alone for longer than the resume window', () => {
      const paused = run(running(90), { type: 'pause', now: T0 + 10 * MINUTE });
      const { session, effects } = reduce(initialSession(), {
        type: 'restore',
        payload: toSaved(paused, T0 + 10 * MINUTE),
        now: T0 + 400 * MINUTE,
      });
      expect(session).toEqual(initialSession());
      expect(effects).toEqual(['clearSaved']);
    });

    it.each([
      ['null', null],
      ['a string', 'not json'],
      ['an empty object', {}],
      ['an unknown mode', { status: 'running', mode: 'sleep', totalSeconds: 60, endsAt: T0 }],
      ['a running payload with no Deadline', { status: 'running', mode: 'focus', totalSeconds: 60, endsAt: null }],
      ['a paused payload with no Deadline', { status: 'paused', mode: 'focus', totalSeconds: 60, remainingSeconds: 10 }],
      ['a payload from the previous version', { remainingSeconds: 300, totalSeconds: 5400, mode: 'focus', savedAt: T0 }],
      ['a non-numeric duration', { status: 'paused', mode: 'focus', totalSeconds: 'lots', remainingSeconds: 10, endsAt: T0 }],
      ['a zero duration', { status: 'paused', mode: 'focus', totalSeconds: 0, remainingSeconds: 0, endsAt: T0 }],
      ['a paused payload with no remaining time recorded', { status: 'paused', mode: 'focus', totalSeconds: 60, endsAt: T0 }],
    ])('falls back to a fresh Session and clears the save for %s', (_label, payload) => {
      const { session, effects } = reduce(running(90), { type: 'restore', payload, now: T0 });
      expect(session).toEqual(initialSession());
      expect(effects).toEqual(['clearSaved']);
    });

    it('says whether there is anything to offer the viewer', () => {
      const restored = (payload: unknown) =>
        reduce(initialSession(), { type: 'restore', payload, now: T0 }).session;
      expect(canResume(restored(toSaved(running(90), T0)))).toBe(true);
      expect(canResume(restored('junk'))).toBe(false);
      expect(canResume(initialSession())).toBe(false);
    });

    it('states the time genuinely left, not the time the Session was saved with', () => {
      const paused = run(running(90), { type: 'pause', now: T0 + 70 * MINUTE });
      const { session } = reduce(initialSession(), {
        type: 'restore',
        payload: toSaved(run(paused, { type: 'resume', now: T0 + 70 * MINUTE }), T0 + 70 * MINUTE),
        now: T0 + 86 * MINUTE,
      });
      expect(session.remainingSeconds).toBe(4 * 60);
      expect(resumeMessage(session)).toBe('You had 4 minutes left on your focus timer. Resume?');
    });
  });

  describe('saved payload', () => {
    it('saves a running Session with its Deadline', () => {
      const saved = toSaved(running(90), T0);
      expect(saved).toMatchObject({ status: 'running', mode: 'focus', endsAt: T0 + 90 * MINUTE });
    });

    it('saves a paused Session with its remaining time, and the Deadline it would have', () => {
      const savedAt = T0 + 10 * MINUTE;
      const saved = toSaved(run(running(90), { type: 'pause', now: savedAt }), savedAt);
      expect(saved).toMatchObject({
        status: 'paused',
        remainingSeconds: 80 * 60,
        endsAt: savedAt + 80 * MINUTE,
      });
    });

    it('saves nothing for an idle, ringing or transition Session', () => {
      const ringing = run(running(1), { type: 'tick', now: T0 + MINUTE });
      expect(toSaved(initialSession(), T0)).toBeNull();
      expect(toSaved(ringing, T0)).toBeNull();
      expect(toSaved(run(ringing, { type: 'dismiss', draw: 0 }), T0)).toBeNull();
    });

    it('round-trips through restore', () => {
      const paused = run(running(90), { type: 'pause', now: T0 + 10 * MINUTE });
      const { session } = reduce(initialSession(), {
        type: 'restore',
        payload: JSON.parse(JSON.stringify(toSaved(paused, T0 + 10 * MINUTE))),
        now: T0 + 20 * MINUTE,
      });
      expect(session).toEqual(paused);
    });
  });

  describe('Effects for each transition', () => {
    const ringing = run(running(1), { type: 'tick', now: T0 + MINUTE });
    const transition = run(ringing, { type: 'dismiss', draw: 0 });
    const paused = run(running(90), { type: 'pause', now: T0 + MINUTE });

    it.each<[string, Session, Event, string[]]>([
      ['start', initialSession(), { type: 'start', mode: 'focus', minutes: 90, now: T0 }, ['showStarfield', 'playEntrance', 'save']],
      ['running tick', running(90), { type: 'tick', now: T0 + 1000 }, []],
      ['completing tick', running(1), { type: 'tick', now: T0 + MINUTE }, ['clearSaved', 'startAlarm', 'pulseRing']],
      ['pause', running(90), { type: 'pause', now: T0 + MINUTE }, ['save']],
      ['resume', paused, { type: 'resume', now: T0 + 2 * MINUTE }, ['showStarfield', 'save']],
      ['reset', running(90), { type: 'reset' }, ['clearSaved']],
      ['reset while ringing', ringing, { type: 'reset' }, ['stopAlarm', 'stopPulse', 'clearSaved']],
      ['dismiss', ringing, { type: 'dismiss', draw: 0 }, ['stopAlarm', 'stopPulse']],
      ['chooseBreak', transition, { type: 'chooseBreak', minutes: 15 }, []],
      ['repeatFocus', transition, { type: 'repeatFocus', now: T0 + 2 * MINUTE }, ['showStarfield', 'playEntrance', 'save']],
      ['restore', initialSession(), { type: 'restore', payload: toSaved(paused, T0 + MINUTE), now: T0 + 2 * MINUTE }, []],
      ['restore of junk', initialSession(), { type: 'restore', payload: 'junk', now: T0 }, ['clearSaved']],
    ])('%s', (_label, session, event, expected) => {
      expect(reduce(session, event).effects).toEqual(expected);
    });
  });

  describe('selectors', () => {
    it('formats seconds as MM:SS', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(59)).toBe('00:59');
      expect(formatTime(90 * 60)).toBe('90:00');
      expect(formatTime(25 * 60 + 7)).toBe('25:07');
    });

    it('maps each status to the screen the page shows', () => {
      const ringing = run(running(1), { type: 'tick', now: T0 + MINUTE });
      expect(screen(initialSession())).toBe('presets');
      expect(screen(running(90))).toBe('timer');
      expect(screen(run(running(90), { type: 'pause', now: T0 }))).toBe('timer');
      expect(screen(ringing)).toBe('alarm');
      expect(screen(run(ringing, { type: 'dismiss', draw: 0 }))).toBe('transition');
    });

    it('reports the ring fraction as time left over time total', () => {
      expect(ringFraction(running(90))).toBe(1);
      expect(ringFraction(run(running(90), { type: 'tick', now: T0 + 45 * MINUTE }))).toBe(0.5);
      expect(ringFraction(run(running(90), { type: 'tick', now: T0 + 90 * MINUTE }))).toBe(0);
    });

    it('names each mode', () => {
      expect(modeLabel('focus')).toBe('Focus Time');
      expect(modeLabel('break')).toBe('Break Time');
    });

    it('offers a break after focus and focus after a break', () => {
      const afterFocus = run(
        running(45),
        { type: 'tick', now: T0 + 45 * MINUTE },
        { type: 'dismiss', draw: 0 },
      );
      expect(nextStart(afterFocus)).toEqual({ mode: 'break', minutes: DEFAULT_BREAK_MINUTES });

      const afterBreak = run(
        afterFocus,
        { type: 'start', mode: 'break', minutes: 5, now: T0 },
        { type: 'tick', now: T0 + 5 * MINUTE },
        { type: 'dismiss', draw: 0 },
      );
      expect(nextStart(afterBreak)).toEqual({ mode: 'focus', minutes: 45 });
    });

    it('offers the default focus duration after a break in a Session that chose none', () => {
      const afterBreak = run(
        initialSession(),
        { type: 'start', mode: 'break', minutes: 5, now: T0 },
        { type: 'tick', now: T0 + 5 * MINUTE },
        { type: 'dismiss', draw: 0 },
      );
      expect(nextStart(afterBreak)).toEqual({ mode: 'focus', minutes: DEFAULT_FOCUS_MINUTES });
    });

    it('shows repeat focus and break choices only after a focus Session', () => {
      const afterFocus = run(
        running(45),
        { type: 'tick', now: T0 + 45 * MINUTE },
        { type: 'dismiss', draw: 0 },
      );
      expect(transitionView(afterFocus)).toMatchObject({
        showsRepeat: true,
        showsBreakChoices: true,
        nextLabel: 'Take a Break',
      });

      const afterBreak = run(
        afterFocus,
        { type: 'start', mode: 'break', minutes: 5, now: T0 },
        { type: 'tick', now: T0 + 5 * MINUTE },
        { type: 'dismiss', draw: 0 },
      );
      expect(transitionView(afterBreak)).toMatchObject({
        showsRepeat: false,
        showsBreakChoices: false,
        nextLabel: 'Start Focus',
      });
    });

    it('words the resume prompt with whole minutes and the right mode', () => {
      const restored = (payload: unknown, now: number) =>
        reduce(initialSession(), { type: 'restore', payload, now }).session;

      const focus = restored(toSaved(running(90), T0), T0 + 30 * MINUTE);
      expect(resumeMessage(focus)).toBe('You had 60 minutes left on your focus timer. Resume?');

      const almostDone = restored(toSaved(running(90), T0), T0 + 89 * MINUTE);
      expect(resumeMessage(almostDone)).toBe('You had 1 minute left on your focus timer. Resume?');

      const onBreak = restored(
        toSaved(run(initialSession(), { type: 'start', mode: 'break', minutes: 30, now: T0 }), T0),
        T0 + 10 * MINUTE,
      );
      expect(resumeMessage(onBreak)).toBe('You had 20 minutes left on your break timer. Resume?');
    });
  });

  describe('Deadline wakeup', () => {
    it('is due at the Deadline of a running Session', () => {
      expect(wakeDelay(running(90), T0)).toBe(90 * MINUTE);
    });

    it('shrinks as the Session runs down', () => {
      expect(wakeDelay(running(90), T0 + 30 * MINUTE)).toBe(60 * MINUTE);
    });

    it('is due immediately once the Deadline is already past', () => {
      // What a tab hidden past its Deadline comes back to: overdue, not negative.
      expect(wakeDelay(running(90), T0 + 91 * MINUTE)).toBe(0);
    });

    it('asks for no wakeup before a Session has started', () => {
      expect(wakeDelay(initialSession(), T0)).toBeNull();
    });

    it('asks for no wakeup while paused', () => {
      const session = run(running(90), { type: 'pause', now: T0 + MINUTE });
      expect(wakeDelay(session, T0 + MINUTE)).toBeNull();
    });

    it('asks again from the new Deadline once resumed', () => {
      const session = run(
        running(90),
        { type: 'pause', now: T0 + 30 * MINUTE },
        { type: 'resume', now: T0 + 90 * MINUTE },
      );
      // An hour was left at the pause, and a pause costs the Session nothing.
      expect(wakeDelay(session, T0 + 90 * MINUTE)).toBe(60 * MINUTE);
    });

    it('asks for no wakeup while ringing', () => {
      const session = run(running(90), { type: 'tick', now: T0 + 90 * MINUTE });
      expect(session.status).toBe('ringing');
      expect(wakeDelay(session, T0 + 90 * MINUTE)).toBeNull();
    });

    it('asks for no wakeup on the transition screen', () => {
      const session = run(
        running(90),
        { type: 'tick', now: T0 + 90 * MINUTE },
        { type: 'dismiss', draw: 0 },
      );
      expect(session.status).toBe('transition');
      expect(wakeDelay(session, T0 + 90 * MINUTE)).toBeNull();
    });

    it('asks for no wakeup after a reset', () => {
      const session = run(running(90), { type: 'reset' });
      expect(wakeDelay(session, T0 + MINUTE)).toBeNull();
    });

    it('asks for no wakeup for a Session restored from storage', () => {
      // A restored Session waits behind the resume prompt; nothing is due yet.
      const saved = toSaved(running(90), T0 + 30 * MINUTE);
      const session = run(initialSession(), {
        type: 'restore',
        payload: saved,
        now: T0 + 31 * MINUTE,
      });
      expect(canResume(session)).toBe(true);
      expect(wakeDelay(session, T0 + 31 * MINUTE)).toBeNull();
    });
  });
});
