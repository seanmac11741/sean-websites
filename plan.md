# Plan

## Repeatable focus timer

- Add a no-break path after a focus timer completes so Sean can run another focus session immediately after dismissing the alarm.
- The repeated focus session should reuse whatever focus duration just completed, including custom durations like 15 minutes.
- Keep the existing break flow available, but make repeating focus the easiest action on the post-focus transition screen.
- Do not add a dedicated 15-minute focus preset; the custom input is sufficient.
- Repeated focus sessions should behave like normal focus timers: same alarm, pause/reset behavior, resume support, indigo focus styling, night ambiance, auto-rotating starfield, and no break-mode drag/dawn state.

## Implementation todo

Transition screen UI (1-4):
1. [x] Add a dedicated repeat-focus control to the post-focus transition screen, with expected outcome that a completed focus session offers a clear way to start another focus session without entering break mode.
2. [x] Make the repeat-focus control the easiest/primary action on the post-focus transition screen, with expected outcome that the repeated-focus workflow is visually prioritized over taking a break.
3. [x] Keep the existing break action available as a secondary choice, with expected outcome that users can still enter the normal break flow after any completed focus session.
4. [x] Ensure the repeat-focus control is hidden or irrelevant after a completed break session, with expected outcome that post-break flow still points users back to focus normally.

Focus duration behavior (5-7):
5. [x] Preserve the completed focus duration before any mode change, with expected outcome that custom durations such as 15 minutes can be repeated exactly.
6. [x] Start the repeated focus timer using the preserved focus duration, with expected outcome that repeated 15-minute focus sessions continue to start at 15:00.
7. [x] Do not add a new 15-minute focus preset, with expected outcome that the preset list remains unchanged and custom input remains the way to choose 15 minutes.

Mode and ambiance behavior (8-12):
8. [x] Keep repeated sessions in focus mode, with expected outcome that clicking repeat focus never switches to break mode.
9. [x] Restore focus styling when repeating focus, with expected outcome that the ring uses the focus color rather than the break color.
10. [x] Restore focus starfield behavior when repeating focus, with expected outcome that night ambiance and auto-rotation are active.
11. [x] Ensure break-only interaction state is disabled when repeating focus, with expected outcome that dawn ambiance, canvas drag mode, and break pointer-event overrides are not active.
12. [x] Confirm the existing break path still enables break styling and drag behavior, with expected outcome that this fix does not regress break mode.

Persistence and controls (13-16):
13. [x] Save repeated focus timers through the existing timer persistence behavior, with expected outcome that leaving and returning during a repeated focus session offers the normal resume prompt.
14. [x] Preserve pause/resume behavior for repeated focus timers, with expected outcome that pause stops countdown and resume continues from the paused time.
15. [x] Preserve reset behavior for repeated focus timers, with expected outcome that reset returns to the preset screen and clears saved timer state.
16. [x] Clear completed timer state before showing transition choices, with expected outcome that completed sessions do not produce stale resume prompts.

Validation (17-20):
17. [x] Add or update tests that verify a post-focus repeat-focus path exists, with expected outcome that the page source includes a distinct no-break repeat action.
18. [x] Add or update tests that verify repeat focus preserves custom/completed duration behavior, with expected outcome that the implementation cannot silently fall back to 90 minutes.
19. [x] Run the test suite and confirm all tests pass.
20. [x] Build the site successfully and confirm there are no Astro, TypeScript, or client-side bundling errors.
