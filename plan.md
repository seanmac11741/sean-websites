# Personal Website Plan — sean-mcconnell.com

All 14 phases are complete. The site is live at `sean-mcconnell.com`.

**Deferred work and future ideas:** `todo.md`

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro 5 (static output) |
| Runtime / PM | Bun |
| Animations | GSAP 3 + ScrollTrigger |
| Styling | Tailwind CSS 4 |
| Hosting | Firebase Hosting |

## Completed Phases

1. **Scaffold & Setup** — Astro + Tailwind + GSAP initialized with Bun
2. **Firebase Setup** — Hosting configured, public dir = `dist/`
3. **Global Layout & Theming** — Layout.astro shell, global.css with `@theme` tokens, Inter font
4. **Navigation** — Sticky nav with scroll-triggered background, mobile hamburger menu
5. **Hero Section** — Full-viewport with GSAP text reveal, typewriter titles, profile photo
6. **About Section** — Two-column layout, bio, key highlights, casual photo
7. **Skills Section** — Responsive grid of 18 tech skills using `simple-icons`
8. **Footer / Contact** — Email CTA, social links, copyright
9. **ScrollTrigger Animations** — All sections animate on scroll entry
10. **Responsive Polish** — Mobile-first layout, overflow-x fix
11. **SEO & Metadata** — OG tags, sitemap, favicon, canonical URL
12. **Content Fill-in** — Real bio, skills from resume, social links, photos
13. **Deploy** — Built and deployed to Firebase Hosting, custom domain connected with SSL
14. **Post-Launch Fixes** — New favicon from logo image, dynamic years of experience, McConnell text cutoff fix, Strava social links, "Request a website" CTA with Google Form
