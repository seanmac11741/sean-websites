# Plan: Add New Presentation

## New presentation content

- Add a new presentation titled “Building an AI Tutor With Google Tools.”
- List the event as “2026 IT Professionals Conference,” matching the public UW–Madison event wording.
- Use May 29, 2026 as the presentation date.
- Use this card description: “A repeatable, model-agnostic approach to using AI tools effectively.”
- Link the presentation card to the public Google Slides deck provided by Sean.
https://docs.google.com/presentation/d/1wJ2-CoKFZ-7xTK5UpJ3VC8nd03pE_bhu1Pps9IyScvc/edit?usp=sharing
- Add a title-slide image exported from the deck so the card matches the existing presentation design.

## Presentations section design

- Redesign the section so only the most recent presentation is featured prominently by default.
- Move older presentations into a collapsed “Previous presentations” area so the section stays focused as more talks are added.
- Use a chevron disclosure interaction for the previous-presentations area to keep the UI lightweight and easy to understand.
- Show previous presentations in a compact scannable format rather than full featured cards, so older talks remain accessible without competing with the newest talk.

## Ordering behavior

- Treat presentation date as the source of truth for recency.
- Feature the newest presentation first, which will make “Building an AI Tutor With Google Tools” the default visible presentation.
- Keep all older presentations available in the previous-presentations dropdown.

## Implementation todo

Content assets (1-3):
1. [x] Export the title slide from the Google Slides deck as a JPG image; expected outcome: a readable 16:9 title-slide image exists for the new presentation.
2. [x] Save the exported image in the presentations image folder using a clear 2026 IT Professionals Conference filename; expected outcome: the image can be loaded from the site’s public image path.
3. [x] Verify the public Google Slides link opens without requiring special permissions; expected outcome: the presentation link loads for a signed-out or non-owner viewer.

Presentation data (4-6):
4. [x] Add the new presentation entry with the approved title, event name, date, description, slide link, and image; expected outcome: the new talk is available to render in the presentations section.
5. [x] Ensure the existing Alliance 2026 presentation remains available as an older presentation; expected outcome: no existing presentation content is lost.
6. [x] Sort presentations by date descending before rendering; expected outcome: the May 29, 2026 presentation is treated as the newest item.

Featured presentation UI (7-9):
7. [x] Render only the newest presentation as the primary featured card by default; expected outcome: the new IT Professionals Conference talk is the only full card visible on initial page load.
8. [x] Preserve the current visual style for the featured presentation card; expected outcome: the featured card still matches the site’s dark theme, hover treatment, image ratio, and “View Slides” CTA.
9. [x] Confirm the featured card opens the approved Google Slides deck in a new tab; expected outcome: clicking the featured card navigates to the correct deck safely.

Previous presentations dropdown (10-13):
10. [x] Add a collapsed “Previous presentations” disclosure below the featured card; expected outcome: older presentations are hidden on initial page load behind a clear expandable control.
11. [x] Add a chevron indicator that visually changes between collapsed and expanded states; expected outcome: users can tell whether the previous-presentations area is open or closed.
12. [x] Render older presentations in a compact scannable layout with title, event/date, description, and “View Slides”; expected outcome: previous talks are accessible without competing with the featured card.
13. [x] Verify the previous presentation link still opens the Alliance 2026 slide deck; expected outcome: the existing talk remains reachable from the dropdown.

Accessibility and responsiveness (14-16):
14. [x] Use an accessible disclosure interaction with keyboard support; expected outcome: the previous-presentations area can be opened and closed without a mouse.
15. [x] Check mobile and desktop layouts; expected outcome: the featured card and compact previous-presentations list remain readable and do not overflow.
16. [x] Ensure image alt text remains meaningful for both featured and previous presentations; expected outcome: screen readers receive useful presentation context.

Validation (17-19):
17. [x] Run the existing test suite after the presentation changes; expected outcome: all current tests pass.
18. [x] Build the site successfully after the presentation changes; expected outcome: the static build completes without Astro, TypeScript, or asset path errors.
19. [x] Manually inspect the presentations section in a local preview; expected outcome: newest talk is featured, older talks are collapsed by default, dropdown behavior works, and all links/images load correctly.
