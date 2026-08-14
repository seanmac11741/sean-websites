/**
 * The Flowstate timer's Session.
 *
 * A Session is the whole timer: which Mode it is in, how long it runs for, and
 * where it has got to. While running it holds a **Deadline** — the absolute
 * instant it ends — and the time remaining is derived from that rather than
 * counted down. A Deadline stays correct in a hidden tab, on a sleeping
 * machine, and across a page reload, which is why no backup timeout is needed.
 *
 * The module is pure: events in, a new Session and a list of **Effects** out.
 * Every decision lives here; the page owns only DOM ids, animation frames,
 * gsap, the alarm oscillator and the star field, and carries out the Effects it
 * is handed without inspecting the Session to decide what they mean.
 *
 * Ambiance stays outside this seam — the Session exposes its Mode, and the star
 * field decides what night and dawn look like (`src/lib/flowstate/ambiance.ts`).
 */

/** What the Session is doing, and so which screen the page shows. */
export type Status = 'idle' | 'running' | 'paused' | 'ringing' | 'transition';

/** Which half of the cycle a Session belongs to. */
export type Mode = 'focus' | 'break';

export interface Session {
  status: Status;
  mode: Mode;
  /** The Session's full length. */
  totalSeconds: number;
  /** The Deadline: the instant this Session ends. Set only while running. */
  endsAt: number | null;
  /** Time left. Derived from the Deadline while running; held while paused. */
  remainingSeconds: number;
  /** How long the last completed focus Session ran — what "Repeat Focus" uses. */
  lastFocusSeconds: number;
  /** The break duration currently chosen on the transition screen. */
  breakSeconds: number;
  /** The phrase shown on the transition screen, once an alarm is dismissed. */
  phrase: string | null;
}

/**
 * Something for the page to carry out. The reducer decides which Effects a
 * transition produces; the page only knows how to perform each one.
 */
export type Effect =
  | 'startAlarm'
  | 'stopAlarm'
  | 'pulseRing'
  | 'stopPulse'
  | 'showStarfield'
  | 'playEntrance'
  | 'clearSaved'
  | 'save';

export type Event =
  | { type: 'start'; mode: Mode; minutes: number; now: number }
  | { type: 'tick'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'reset' }
  | { type: 'dismiss'; draw: number }
  | { type: 'chooseBreak'; minutes: number }
  | { type: 'repeatFocus'; now: number }
  | { type: 'restore'; payload: unknown; now: number };

export interface Outcome {
  session: Session;
  effects: Effect[];
}

/**
 * What a running or paused Session is written to storage as.
 *
 * Every saved payload carries a Deadline, including a paused one — for a paused
 * Session it is the instant it would end had it kept running from the save.
 * That is what makes a saved Session's age knowable, and so what makes it
 * expirable. A payload without one is not a payload this version wrote.
 */
export interface SavedSession {
  status: 'running' | 'paused';
  mode: Mode;
  totalSeconds: number;
  endsAt: number;
  remainingSeconds: number;
  lastFocusSeconds: number;
  breakSeconds: number;
}

export const DEFAULT_FOCUS_MINUTES = 90;
export const DEFAULT_BREAK_MINUTES = 30;
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 300;

/**
 * How long past its Deadline a saved Session is still worth offering back.
 * Walk away from a Session for longer than this and it is gone: the preset
 * screen is a truer answer than a prompt about something long dead.
 */
export const RESUME_WINDOW_MS = 60 * 60 * 1000;

export const FOCUS_PHRASES: readonly string[] = [
  'Go take a nap, you earned it.',
  'Look up a YouTube video on cats.',
  'Stretch it out. Touch your toes.',
  'Go for a walk around the block.',
  'Grab a snack. Hydrate. Breathe.',
  'Stare out a window for a bit.',
  "Text someone you haven't talked to in a while.",
  'Do 20 push-ups. Or 5. Or 1.',
  'Put on your favorite song and just listen.',
  'Close your eyes for 2 minutes. Seriously.',
];

export const BREAK_PHRASES: readonly string[] = [
  "Time to lock in. Let's go.",
  "You're refreshed. Now crush it.",
  'Back to the grind. Build something great.',
  'Flow state awaits. Focus up.',
  "Break's over. Ship something.",
  'Channel that energy. Go deep.',
  "The code isn't gonna write itself.",
  'Ready? Set? Lock in.',
  "Fresh eyes, fresh mind. Let's build.",
  'One more session. You got this.',
];

export function initialSession(): Session {
  return {
    status: 'idle',
    mode: 'focus',
    totalSeconds: DEFAULT_FOCUS_MINUTES * 60,
    endsAt: null,
    remainingSeconds: DEFAULT_FOCUS_MINUTES * 60,
    lastFocusSeconds: DEFAULT_FOCUS_MINUTES * 60,
    breakSeconds: DEFAULT_BREAK_MINUTES * 60,
    phrase: null,
  };
}

function minutesToSeconds(minutes: number): number {
  const safe = Number.isFinite(minutes) ? minutes : DEFAULT_FOCUS_MINUTES;
  return Math.round(Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, safe)) * 60);
}

/** Seconds left at `now` — from the Deadline while running, held otherwise. */
export function remainingAt(session: Session, now: number): number {
  if (session.status !== 'running' || session.endsAt === null) return session.remainingSeconds;
  return secondsUntil(session.endsAt, now);
}

function secondsUntil(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

function begin(session: Session, mode: Mode, totalSeconds: number, now: number): Outcome {
  return {
    session: {
      ...session,
      status: 'running',
      mode,
      totalSeconds,
      endsAt: now + totalSeconds * 1000,
      remainingSeconds: totalSeconds,
      phrase: null,
    },
    effects: ['showStarfield', 'playEntrance', 'save'],
  };
}

function unchanged(session: Session): Outcome {
  return { session, effects: [] };
}

export function reduce(session: Session, event: Event): Outcome {
  switch (event.type) {
    case 'start':
      return begin(session, event.mode, minutesToSeconds(event.minutes), event.now);

    case 'tick': {
      if (session.status !== 'running') return unchanged(session);
      const remainingSeconds = remainingAt(session, event.now);
      if (remainingSeconds > 0) return unchanged({ ...session, remainingSeconds });

      // Completion is a consequence of a tick crossing the Deadline, however
      // late that tick arrives — never something the page decides.
      return {
        session: {
          ...session,
          status: 'ringing',
          endsAt: null,
          remainingSeconds: 0,
          lastFocusSeconds:
            session.mode === 'focus' ? session.totalSeconds : session.lastFocusSeconds,
        },
        effects: ['clearSaved', 'startAlarm', 'pulseRing'],
      };
    }

    case 'pause':
      if (session.status !== 'running') return unchanged(session);
      return {
        session: {
          ...session,
          status: 'paused',
          remainingSeconds: remainingAt(session, event.now),
          endsAt: null,
        },
        effects: ['save'],
      };

    case 'resume':
      if (session.status !== 'paused') return unchanged(session);
      return {
        session: {
          ...session,
          status: 'running',
          endsAt: event.now + session.remainingSeconds * 1000,
        },
        effects: ['showStarfield', 'save'],
      };

    case 'reset':
      return {
        session: {
          ...session,
          status: 'idle',
          endsAt: null,
          remainingSeconds: session.totalSeconds,
          phrase: null,
        },
        effects:
          session.status === 'ringing'
            ? ['stopAlarm', 'stopPulse', 'clearSaved']
            : ['clearSaved'],
      };

    case 'dismiss':
      if (session.status !== 'ringing') return unchanged(session);
      return {
        session: {
          ...session,
          status: 'transition',
          phrase: choosePhrase(session.mode, event.draw),
        },
        effects: ['stopAlarm', 'stopPulse'],
      };

    case 'chooseBreak':
      return unchanged({ ...session, breakSeconds: minutesToSeconds(event.minutes) });

    case 'repeatFocus':
      return begin(session, 'focus', session.lastFocusSeconds, event.now);

    case 'restore': {
      // Anything this version does not recognise — junk, a payload from before
      // Sessions carried a Deadline, or one gone stale — is dropped, and the
      // storage it came from is cleared rather than left to be re-read.
      const saved = parseSaved(event.payload);
      if (!saved || !withinResumeWindow(saved, event.now)) {
        return { session: initialSession(), effects: ['clearSaved'] };
      }

      // A restored Session waits for the viewer to say "resume" — it does not
      // resume itself, so it comes back paused however it was saved.
      return {
        session: {
          status: 'paused',
          mode: saved.mode,
          totalSeconds: saved.totalSeconds,
          endsAt: null,
          // A Session that was running kept running while the page was gone,
          // so the time it comes back with is the time genuinely left. A paused
          // one was not counting, and comes back with what it was paused at.
          remainingSeconds:
            saved.status === 'running'
              ? secondsUntil(saved.endsAt, event.now)
              : Math.max(0, Math.floor(saved.remainingSeconds)),
          lastFocusSeconds: saved.lastFocusSeconds,
          breakSeconds: saved.breakSeconds,
          phrase: null,
        },
        effects: [],
      };
    }
  }
}

/** The phrase for a completed Session in `mode`, chosen by a draw in [0, 1]. */
export function choosePhrase(mode: Mode, draw: number): string {
  const phrases = mode === 'focus' ? FOCUS_PHRASES : BREAK_PHRASES;
  const safe = Number.isFinite(draw) ? draw : 0;
  const index = Math.min(phrases.length - 1, Math.max(0, Math.floor(safe * phrases.length)));
  return phrases[index];
}

// === Saved payload ===

/** What to persist at `now`, or null when this Session must not be restored. */
export function toSaved(session: Session, now: number): SavedSession | null {
  if (session.status !== 'running' && session.status !== 'paused') return null;
  return {
    status: session.status,
    mode: session.mode,
    totalSeconds: session.totalSeconds,
    endsAt: session.endsAt ?? now + session.remainingSeconds * 1000,
    remainingSeconds: session.remainingSeconds,
    lastFocusSeconds: session.lastFocusSeconds,
    breakSeconds: session.breakSeconds,
  };
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * The instant a saved Session stopped being live: its Deadline while running,
 * and the instant it was written while paused — a paused Session counts down no
 * further, so what makes it stale is how long ago it was left, not when it
 * would have ended. Both are read off the Deadline every payload carries.
 */
function lastLiveAt(saved: SavedSession): number {
  if (saved.status === 'running') return saved.endsAt;
  return saved.endsAt - saved.remainingSeconds * 1000;
}

/** Whether a saved Session is recent enough to still be worth offering back. */
function withinResumeWindow(saved: SavedSession, now: number): boolean {
  return now - lastLiveAt(saved) <= RESUME_WINDOW_MS;
}

function parseSaved(payload: unknown): SavedSession | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const raw = payload as Record<string, unknown>;

  const mode = raw.mode;
  if (mode !== 'focus' && mode !== 'break') return null;

  const totalSeconds = raw.totalSeconds;
  if (typeof totalSeconds !== 'number' || !Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return null;
  }

  // No Deadline, no payload: this is either junk or something written before
  // Sessions carried one, and either way there is no telling how old it is.
  const endsAt = raw.endsAt;
  if (typeof endsAt !== 'number' || !Number.isFinite(endsAt)) return null;

  const remainingSeconds =
    typeof raw.remainingSeconds === 'number' && Number.isFinite(raw.remainingSeconds)
      ? raw.remainingSeconds
      : null;

  const status = raw.status === 'running' ? 'running' : 'paused';
  if (status === 'paused' && remainingSeconds === null) return null;

  return {
    status,
    mode,
    totalSeconds,
    endsAt,
    remainingSeconds: remainingSeconds ?? 0,
    lastFocusSeconds: positiveNumber(raw.lastFocusSeconds, DEFAULT_FOCUS_MINUTES * 60),
    breakSeconds: positiveNumber(raw.breakSeconds, DEFAULT_BREAK_MINUTES * 60),
  };
}

// === Selectors ===

/** MM:SS, minutes unbounded so a 120-minute Session reads "120:00". */
export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export type Screen = 'presets' | 'timer' | 'alarm' | 'transition';

/** Which screen a Session's status puts the page on. */
export function screen(session: Session): Screen {
  switch (session.status) {
    case 'idle':
      return 'presets';
    case 'running':
    case 'paused':
      return 'timer';
    case 'ringing':
      return 'alarm';
    case 'transition':
      return 'transition';
  }
}

/**
 * Whether a Session restored from storage is one the viewer can be offered.
 * A junk payload restores as idle, and there is nothing to resume.
 */
export function canResume(session: Session): boolean {
  return session.status === 'paused';
}

/** How much of the ring is still filled, from 1 at the start to 0 at the end. */
export function ringFraction(session: Session): number {
  if (session.totalSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, session.remainingSeconds / session.totalSeconds));
}

export function modeLabel(mode: Mode): string {
  return mode === 'focus' ? 'Focus Time' : 'Break Time';
}

/** The duration a mode starts at when it is chosen fresh on the preset screen. */
export function defaultMinutes(mode: Mode): number {
  return mode === 'focus' ? DEFAULT_FOCUS_MINUTES : DEFAULT_BREAK_MINUTES;
}

/** What the transition screen's main button starts: the other half of the cycle. */
export function nextStart(session: Session): { mode: Mode; minutes: number } {
  return session.mode === 'focus'
    ? { mode: 'break', minutes: Math.round(session.breakSeconds / 60) }
    : { mode: 'focus', minutes: DEFAULT_FOCUS_MINUTES };
}

export interface TransitionView {
  phrase: string;
  showsRepeat: boolean;
  showsBreakChoices: boolean;
  nextLabel: string;
}

/** Everything the transition screen shows, decided from the Session that ended. */
export function transitionView(session: Session): TransitionView {
  const afterFocus = session.mode === 'focus';
  return {
    phrase: session.phrase ?? '',
    showsRepeat: afterFocus,
    showsBreakChoices: afterFocus,
    nextLabel: afterFocus ? 'Take a Break' : 'Start Focus',
  };
}

/** The wording of the resume prompt for a Session restored from storage. */
export function resumeMessage(session: Session): string {
  const minutes = Math.ceil(session.remainingSeconds / 60);
  const plural = minutes === 1 ? '' : 's';
  return `You had ${minutes} minute${plural} left on your ${session.mode} timer. Resume?`;
}
