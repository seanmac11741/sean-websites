/**
 * The CFOP walkthrough: Learn mode teaching the viewer to solve their own
 * cube, one Lesson per Stage of the Solve. Pure: no DOM, no timers.
 */

import { applyMoves, type Colour, type Cube, type Vec } from './cube';
import { algorithmMoves, LOOKS, recognise } from './last-layer';
import { playback, SOLVE_TURN_SECONDS, type Step } from './playback';
import { solve } from './solve';

const TITLES = [
  'Cross',
  'F2L pair 1 of 4',
  'F2L pair 2 of 4',
  'F2L pair 3 of 4',
  'F2L pair 4 of 4',
  'OLL: yellow cross',
  'OLL: yellow corners',
  'PLL: corners',
  'PLL: edges',
];

/** How the viewer holds their cube for every Lesson: white is on the bottom throughout. */
export const HOLD = 'Hold your cube with yellow on top, green in front and orange on the right.';

/** The case an OLL or PLL Lesson found, as the notes name and hold it. */
export interface LessonCase {
  readonly name: string;
  /** "This is an L-shape." */
  readonly called: string;
  /** Where the case sits once lined up, from the notes. */
  readonly hold: string;
  /** The algorithm as the notes write it. */
  readonly notation: string;
  /** Says which turn of the top lines the case up, when one does. */
  readonly lineUp: string | null;
}

/** One step of the walkthrough: a Stage of the Solve, taught. */
export interface Lesson {
  readonly title: string;
  /** Exactly the Stage's moves, as the solver found them. */
  readonly moves: readonly string[];
  /** What this Lesson does, in plain English, chosen for the cube it finds. */
  readonly goal: string;
  /** For OLL and PLL, the case found; null for the Cross, F2L, and a Look with nothing to do. */
  readonly case: LessonCase | null;
  /** The cube as this Lesson finds it. */
  readonly start: Cube;
}

// --- Reading the cube ------------------------------------------------------------

const same = (a: Vec, b: Vec) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
/** The Colour of the centre that looks out along `normal`. */
const centre = (cube: Cube, normal: Vec): Colour => cube.stickers.find((s) => same(s.position, normal))!.colour;
/** A piece is home when every Sticker on it matches the centre of the face it looks out of. */
const home = (cube: Cube, position: Vec) =>
  cube.stickers.filter((s) => same(s.position, position)).every((s) => s.colour === centre(cube, s.normal));

/** "a", "a and b", "a, b and c". */
const list = (words: readonly string[]) =>
  words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;

// --- The goals -------------------------------------------------------------------

/** The bottom edges' sides, front, right, back, left. */
const CROSS_SIDES: readonly Vec[] = [
  [0, 0, 1],
  [1, 0, 0],
  [0, 0, -1],
  [-1, 0, 0],
];

function crossGoal(cube: Cube): string {
  const down = centre(cube, [0, -1, 0]);
  const edges = CROSS_SIDES.map((side) => ({
    side: centre(cube, side),
    home: home(cube, [side[0], -1, side[2]]),
  }));
  const todo = edges.filter((e) => !e.home).map((e) => e.side);
  const done = edges.filter((e) => e.home).map((e) => `${down}-${e.side}`);
  if (todo.length === 0) return `The ${down} cross is already done, so there is nothing to do here.`;
  const one = todo.length === 1;
  const bring = `Bring the ${list(todo.map((side) => `${down}-${side}`))} edge${one ? '' : 's'} down next to the ${list(todo)} centre${one ? '' : 's'}.`;
  if (done.length === 0) return bring;
  return `${bring} The ${list(done)} edge${done.length === 1 ? ' is' : 's are'} already in place.`;
}

/** The four F2L slots, by name and the x and z of their corner and edge. */
const SLOTS = [
  { name: 'front-right', x: 1, z: 1 },
  { name: 'front-left', x: -1, z: 1 },
  { name: 'back-right', x: 1, z: -1 },
  { name: 'back-left', x: -1, z: -1 },
] as const;
type Slot = (typeof SLOTS)[number];

const slotHome = (cube: Cube, { x, z }: Slot) => home(cube, [x, -1, z]) && home(cube, [x, 0, z]);

/**
 * Which slot an F2L Lesson fills: the one it solves, or for a Lesson with
 * nothing to do, the first slot already solved that no earlier Lesson took.
 */
function slotFilled(before: Cube, after: Cube, taken: readonly Slot[]): Slot {
  const open = SLOTS.filter((slot) => !taken.includes(slot) && slotHome(after, slot));
  return open.find((slot) => !slotHome(before, slot)) ?? open[0];
}

function pairGoal(cube: Cube, slot: Slot, nothingToDo: boolean): string {
  const { x, z } = slot;
  const down = centre(cube, [0, -1, 0]);
  const sides = `${centre(cube, [0, 0, z])}-${centre(cube, [x, 0, 0])}`;
  const corner = `${down}-${sides} corner`;
  const edge = `${sides} edge`;
  const where = `the ${slot.name} slot`;
  if (nothingToDo) return `The ${corner} and ${edge} are already in ${where}, so there is nothing to do here.`;
  const cornerHome = home(cube, [x, -1, z]);
  const edgeHome = home(cube, [x, 0, z]);
  if (edgeHome && !cornerHome) return `Put the ${corner} into ${where}, under the ${edge} already there.`;
  if (cornerHome && !edgeHome) return `Put the ${edge} into ${where}, above the ${corner} already there.`;
  return `Pair the ${corner} with the ${edge}, then put them in ${where}.`;
}

/** Each Look's goal, and what to say when it is already reached. */
const LOOK_GOALS = [
  ['Make a yellow cross on top.', 'The yellow cross is already there'],
  ['Turn the yellow corners up, so the whole top is yellow.', 'The whole top is already yellow'],
  ['Swap the top corners into place, so each side’s two top corners match.', 'The top corners are already in place'],
  ['Swap the top edges into place, and the cube is solved.', 'The top edges are already in place'],
] as const;

/** "a Sune", "an L-shape", "an H", "a U". A lone letter goes by how it is said. */
function withArticle(name: string): string {
  const word = name.split(/[\s-]/)[0];
  const an = word.length === 1 ? /[AEFHILMNORSX]/.test(word) : /^[AEIO]/i.test(word);
  return `${an ? 'an' : 'a'} ${name}`;
}

/** The goal and case of the Lesson for Look `l`, playing `moves` on `cube`. */
function lookLesson(cube: Cube, l: number, moves: readonly string[]): Pick<Lesson, 'goal' | 'case'> {
  const [goal, already] = LOOK_GOALS[l];
  const found = recognise(cube, LOOKS[l]);
  const played = found ? found.setup.length + algorithmMoves(found.algorithm).length : 0;
  const home = moves.slice(played);
  const finish = home.length ? ` Finish with ${home.join(' ')} to turn the top home.` : '';
  if (!found) {
    return { goal: home.length ? `${already}.${finish}` : `${already}, so there is nothing to do here.`, case: null };
  }
  const { algorithm, setup } = found;
  return {
    goal: goal + finish,
    case: {
      name: algorithm.name,
      called: `This is ${withArticle(algorithm.name)}.`,
      hold: algorithm.hold,
      notation: algorithm.notation,
      lineUp: setup.length ? `The first move, ${setup.join(' ')}, turns the top to line it up.` : null,
    },
  };
}

/**
 * The walkthrough for `cube`, held yellow up and green in front: one Lesson per
 * Stage of its Solve, in order, each with exactly the solver's moves and the
 * cube as that Lesson finds it, so stepping between Lessons never drifts.
 */
export function walkthrough(cube: Cube): Lesson[] {
  let at = cube;
  const taken: Slot[] = [];
  return solve(cube).map((stage, i): Lesson => {
    const start = at;
    at = applyMoves(at, stage.moves.join(' '));
    const lesson = { title: TITLES[i], moves: stage.moves, start };
    if (i === 0) return { ...lesson, goal: crossGoal(start), case: null };
    if (i <= 4) {
      const slot = slotFilled(start, at, taken);
      taken.push(slot);
      return { ...lesson, goal: pairGoal(start, slot, stage.moves.length === 0), case: null };
    }
    return { ...lesson, ...lookLesson(start, i - 5, stage.moves) };
  });
}

/** A Lesson's pace: the Solve's own, and the replay-slowly one. */
export const LESSON_TURN_SECONDS = SOLVE_TURN_SECONDS;
export const SLOW_TURN_SECONDS = 1.4;

/** The move Steps that play a Lesson on the cube, from its start, at its pace or slowly. */
export function lessonSteps(lesson: Lesson, slow: boolean): Extract<Step, { kind: 'move' }>[] {
  const seconds = slow ? SLOW_TURN_SECONDS : LESSON_TURN_SECONDS;
  return playback([{ label: lesson.title, moves: lesson.moves }])
    .filter((step): step is Extract<Step, { kind: 'move' }> => step.kind === 'move')
    .map((step) => ({ ...step, seconds }));
}
