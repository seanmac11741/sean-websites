# Plan

## About contact options

- Add a compact contact row near the top of the About section so UW-Madison contacts can find the correct address quickly.
- Present two clear contact paths: UW-Madison email first for university/professional correspondence, and personal projects second for side projects or website inquiries.
- Protect the UW-Madison email from basic scraping by not rendering it as a plain static email or direct mail link; visitors will use a JavaScript-powered copy action instead.
- Keep the personal projects email as the existing direct Gmail contact path for convenience, since it is already publicly listed on the site.

## Implementation todo

About contact UI (1-4):
1. [x] Add a compact two-option contact row near the top of the About section, immediately after the opening professional summary, with the UW-Madison option visually first and easiest to notice.
2. [x] Label the first contact option with “UW-Madison email” so university collaborators immediately recognize the correct channel.
3. [x] Label the second contact option for personal projects and connect it to the existing personal Gmail contact path.
4. [x] Ensure the contact row works cleanly on mobile and desktop, with readable spacing and no crowding around the About text.

UW-Madison email protection (5-8):
5. [x] Implement the UW-Madison email as a JavaScript-powered copy action instead of a static visible email address or direct mail link.
6. [x] Assemble the UW-Madison email only in client-side JavaScript so the full address is not present as plain static page text.
7. [x] Provide clear button feedback after copying, such as changing the label to “Copied!” so visitors know the action succeeded.
8. [x] Include a graceful fallback message if clipboard copying is unavailable, with an expected outcome that the visitor still understands how to contact Sean.

Validation (9-11):
9. [x] Verify the rendered page does not expose the full UW-Madison email as plain visible static text in the About markup.
10. [x] Run the site test suite and confirm existing tests still pass.
11. [x] Build the site successfully and confirm the About section renders without TypeScript, Astro, or client-side runtime errors.
