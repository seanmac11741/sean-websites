import { describe, expect, it } from 'vitest';
import { applyMoves, faces, isSolved, solvedCube } from '../../src/lib/speed-cubing/cube';
import { scramble } from '../../src/lib/speed-cubing/scramble';
import { algorithmMoves, LOOKS, PLL_CORNERS, PLL_EDGES, YELLOW_CORNERS, YELLOW_CROSS, type Look } from '../../src/lib/speed-cubing/last-layer';
import { GALLERY } from '../../src/lib/speed-cubing/reference';
import { solve } from '../../src/lib/speed-cubing/solve';
import { LESSON_TURN_SECONDS, lessonSteps, SLOW_TURN_SECONDS, walkthrough } from '../../src/lib/speed-cubing/walkthrough';

/** A deterministic uniform source, so a scramble is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Undoes a run of moves: reversed, each one turned the other way. */
const inverse = (moves: readonly string[]) =>
  [...moves].reverse().map((m) => (m.endsWith("'") ? m[0] : m.endsWith('2') ? m : `${m}'`));

/** The case an algorithm solves: a solved cube with the algorithm run backwards, then `turn` of the top. */
const caseOf = (look: Look, name: string, turn = '') => {
  const algorithm = look.algorithms.find((a) => a.name === name)!;
  return applyMoves(solvedCube(), [...inverse(algorithmMoves(algorithm)), turn].join(' ').trim());
};

const scrambled = (seed: number) => applyMoves(solvedCube(), scramble(mulberry32(seed)).join(' '));

describe('the CFOP walkthrough', () => {
  it('teaches the Stages in order: Cross, four F2L pairs, two OLL Looks, two PLL Looks', () => {
    expect(walkthrough(scrambled(1)).map((l) => l.title)).toEqual([
      'Cross',
      'F2L pair 1 of 4',
      'F2L pair 2 of 4',
      'F2L pair 3 of 4',
      'F2L pair 4 of 4',
      'OLL: Yellow cross',
      'OLL: Yellow corners',
      'PLL: Corners',
      'PLL: Edges',
    ]);
  });

  it('titles each OLL and PLL Lesson as the algorithm gallery names its step', () => {
    const titles = walkthrough(scrambled(2)).slice(5).map((l) => l.title);
    expect(titles).toEqual(LOOKS.map((look) => GALLERY.find((c) => c.look === look)!.step));
  });

  it('plays exactly the moves the solver finds, each Lesson starting where the last one left the cube, ending solved', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const cube = scrambled(seed);
      const lessons = walkthrough(cube);
      expect(lessons.map((l) => l.moves)).toEqual(solve(cube).map((s) => s.moves));
      let at = cube;
      for (const lesson of lessons) {
        expect(faces(lesson.start)).toEqual(faces(at));
        at = applyMoves(at, lesson.moves.join(' '));
      }
      expect(isSolved(at)).toBe(true);
    }
  });

  describe('the Cross goal', () => {
    const crossGoal = (moves: string) => walkthrough(applyMoves(solvedCube(), moves))[0].goal;

    it('names the one white edge to bring down, and the centre it goes next to', () => {
      expect(crossGoal('F')).toBe(
        'Bring the white-green edge down next to the green centre. The white-orange, white-blue and white-red edges are already in place.',
      );
    });

    it('names every white edge still to bring down', () => {
      expect(crossGoal("F R'")).toBe(
        'Bring the white-green and white-orange edges down next to the green and orange centres. The white-blue and white-red edges are already in place.',
      );
      expect(crossGoal('F R B L')).toBe(
        'Bring the white-green, white-orange, white-blue and white-red edges down next to the green, orange, blue and red centres.',
      );
    });

    it('says when the white cross is already done', () => {
      expect(crossGoal("R U R' U'")).toBe('The white cross is already done, so there is nothing to do here.');
    });
  });

  describe('the F2L pair goals', () => {
    const goals = (moves: string) => walkthrough(applyMoves(solvedCube(), moves)).slice(1, 5).map((l) => l.goal);

    it('names the corner and edge to pair, and the slot they go in', () => {
      expect(goals("R U R'")[3]).toBe(
        'Pair the white-green-orange corner with the green-orange edge, then put them in the front-right slot.',
      );
      expect(goals("L' U' L")[3]).toBe(
        'Pair the white-green-red corner with the green-red edge, then put them in the front-left slot.',
      );
    });

    it('names the slot each pair goes in, in the order the solver takes them', () => {
      expect(goals("R U R' U R U' R' U L' U L").slice(2)).toEqual([
        'Pair the white-green-orange corner with the green-orange edge, then put them in the front-right slot.',
        'Pair the white-green-red corner with the green-red edge, then put them in the front-left slot.',
      ]);
    });

    it('says when a pair is already in its slot', () => {
      expect(goals("R U R'").slice(0, 3)).toEqual([
        'The white-green-red corner and green-red edge are already in the front-left slot, so there is nothing to do here.',
        'The white-blue-orange corner and blue-orange edge are already in the back-right slot, so there is nothing to do here.',
        'The white-blue-red corner and blue-red edge are already in the back-left slot, so there is nothing to do here.',
      ]);
    });

    it('says when only the corner, or only the edge, is missing from the slot', () => {
      expect(goals("R U R' U' R U R' U' R U R' U'")[3]).toBe(
        'Put the white-green-orange corner into the front-right slot, under the green-orange edge already there.',
      );
      expect(goals("R U' R' U' F' U F")[3]).toBe(
        'Put the green-orange edge into the front-right slot, above the white-green-orange corner already there.',
      );
    });
  });

  describe('the OLL and PLL Lessons', () => {
    it('name the case, say how to hold the cube, and give the algorithm from the notes', () => {
      const lesson = walkthrough(caseOf(YELLOW_CORNERS, 'Sune'))[6];
      expect(lesson.goal).toBe('Turn the yellow corners up, so the whole top is yellow.');
      expect(lesson.case).toEqual({
        name: 'Sune',
        called: 'This is a Sune.',
        hold: 'One corner yellow on top: turn the top so yellow shows on the front face’s top right.',
        notation: "R U R' U R U2 R'",
      });
      expect(lesson.moves).toEqual(['R', 'U', "R'", 'U', 'R', 'U2', "R'"]);
    });

    it('say to line the case up with the first turn of the top, and how it looks once lined up', () => {
      const lesson = walkthrough(caseOf(YELLOW_CROSS, 'L-shape', 'U'))[5];
      expect(lesson.goal).toBe('Make a yellow cross on top.');
      expect(lesson.case?.called).toBe('This is an L-shape.');
      expect(lesson.case?.hold).toBe(
        "Keep yellow on top and green in front, and turn the top with U' first to line it up. " +
          'Then it looks like this: two yellow edges side by side: hold them at the front and on the right.',
      );
      expect(lesson.moves[0]).toBe("U'");
    });

    it('name every case the walkthrough meets with the right article', () => {
      const called = (look: Look, index: number, name: string) =>
        walkthrough(caseOf(look, name))[index].case?.called;
      expect(called(YELLOW_CORNERS, 6, 'Antisune')).toBe('This is an Antisune.');
      expect(called(YELLOW_CORNERS, 6, 'H')).toBe('This is an H.');
      expect(called(YELLOW_CORNERS, 6, 'U')).toBe('This is a U.');
      expect(called(PLL_CORNERS, 7, 'Adjacent Corner Swap')).toBe('This is an Adjacent Corner Swap.');
      expect(called(PLL_EDGES, 8, 'Right to Left')).toBe('This is a Right to Left.');
    });

    it('find the same case the solver does, for every case in the notes', () => {
      LOOKS.forEach((look, i) => {
        for (const algorithm of look.algorithms) {
          for (const turn of ['', 'U', 'U2', "U'"]) {
            const cube = caseOf(look, algorithm.name, turn);
            const lesson = walkthrough(cube)[5 + i];
            expect(lesson.case?.name).toBe(algorithm.name);
            expect(lesson.case?.notation).toBe(algorithm.notation);
            const hold = GALLERY.find((c) => c.algorithm.name === algorithm.name)!.hold;
            // Held as the gallery says, or lined up first and then held so.
            const said = lesson.case!.hold;
            expect(said === hold || said.toLowerCase().endsWith(`then it looks like this: ${hold.toLowerCase()}`), said).toBe(true);
            expect(solve(cube)[5 + i].label).toBe(`${look.method}: ${algorithm.name}`);
          }
        }
      });
    });

    it('say when a Look has nothing to do, and how the last one turns the top home', () => {
      const lessons = walkthrough(applyMoves(solvedCube(), 'U2'));
      expect(lessons.slice(5).map((l) => [l.goal, l.case])).toEqual([
        ['The yellow cross is already there, so there is nothing to do here.', null],
        ['The whole top is already yellow, so there is nothing to do here.', null],
        ['The top corners are already in place, so there is nothing to do here.', null],
        ['The top edges are already in place. Finish with U2 to turn the top home.', null],
      ]);
      expect(walkthrough(caseOf(PLL_EDGES, 'Opposite Edge Swap', 'U'))[8].goal).toBe(
        'Swap the top edges into place, and the cube is solved. Finish with U\' to turn the top home.',
      );
    });
  });

  describe('playing a Lesson', () => {
    it('turns each of its moves in order, tagged with its place, so the move list highlights as it plays', () => {
      const lesson = walkthrough(caseOf(YELLOW_CORNERS, 'L'))[6];
      const steps = lessonSteps(lesson, false);
      expect(steps.map((s) => s.move)).toEqual(['x', "R'", 'U', 'R', "D'", "R'", "U'", 'R', 'D', "x'"]);
      expect(steps.map((s) => s.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(steps.every((s) => s.seconds === LESSON_TURN_SECONDS)).toBe(true);
    });

    it('replays slowly at the slow pace', () => {
      const lesson = walkthrough(caseOf(YELLOW_CORNERS, 'Sune'))[6];
      expect(lessonSteps(lesson, true).every((s) => s.seconds === SLOW_TURN_SECONDS)).toBe(true);
      expect(SLOW_TURN_SECONDS).toBeGreaterThan(LESSON_TURN_SECONDS);
    });
  });
});
