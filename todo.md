# TODO

## Bugs 
* Error on build in github actions: 
Node.js 20 actions are deprecated. The following actions are running on Node.js 20 and may not work as expected: actions/checkout@v4, oven-sh/setup-bun@v2. Actions will be forced to run with Node.js 24 by default starting June 2nd, 2026. Please check if updated versions of these actions are available that support Node.js 24. To opt into Node.js 24 now, set the FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true environment variable on the runner or in your workflow file. Once Node.js 24 becomes the default, you can temporarily opt out by setting ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true. For more information see: https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/
* Error on function deploy 
✔  functions[api(us-central1)] Successful update operation.
Function URL (api(us-central1)): https://api-qcddk2slca-uc.a.run.app
i  functions: cleaning up build files...
⚠  functions: Unhandled error cleaning up build images. This could result in a small monthly bill if not corrected. You can attempt to delete these images by redeploying or you can delete them manually at
	https://console.cloud.google.com/artifacts/docker/sean-mcconnell-site/us-central1/gcf-artifacts
	https://console.cloud.google.com/gcr/images/sean-mcconnell-site/us/gcf


## Other
* Sean 2. An Ai bot that I train on all my blog posts that I write. It should be something like a RAG system, that has access to my writings and code and acts like me. It will be terrible at first, but should get better as I add more data to it. Just text at first of me writing, but later, it would be cool to add like a vlog-style video thing, where I can make a video of myself, and have the bot interview me to get more of an idea of my full personality so it can act more like me. Could have veo for video generation and audio generation of my voice as well. Backend cloud functions to train a model, and a front end chat interface, where anyone that comes to the site could do a one-shot interaction with me. Ask my bot anything and it will respond (once and only once) in my voice. Would be hard to make this so that I don't get 1 million requests, would have to limit per IP address or something.
Clone my own voice like this: https://github.com/QwenLM/Qwen3-TTS
* My most recent run from strava api? not sure if possible without strava login. Maybe use Garmin?
* Accept payments on my website. Have somewhere I can place an invoice for a customer and they get a link to my website at sean-mcconnell.com/invoice123. I think it needs to be behind auth based on email address of my client? Otherwise anyone could access the invoice. 
* Need to run ads in case this goes viral so I don't have to pay a bunch

## Blog ideas
* How I built this site with Claude
* How to use AI like a software engineer
* How to use gemini cli with obsidian

## CI/CD
* Figure out how to add the build passed icons that are on github to my webpage and the github readme?

## Tools page
A separate page at sean-mcconnell.com/tools
* Flow state room. A timer that counts down from 90 minutes with cool animations and a big button you can push to start it. it should also embed any number of youtube videos that are "concentration/flow state music" and play it for you. When the timer gets to zero, it should beep super loud and tell the user to take a break.
* CV resume builder. Just a thing you can enter a bunch of info into and it builds out a one page resume. Should all be done client side with javascript, no file saving on a database or anything. Should be a download button though, if I can just stream the file out like that? Might have to write it to local storage or something.
* WYSIWG editor from my admin page available at /tools/fileWriter. It should not save anything to my cloud, just do it all in the browser and localstorage. Probably need a blurb at the bottom explaining that with links to source code on Github


## Projects Section

Add a Projects showcase section between Skills and Contact:
- Cards with project name, brief description, tech tags, link to GitHub/GitLab
- GSAP scroll-triggered entrance (staggered card reveal)
- Data can live in a `src/data/projects.ts` array for easy editing
- Showcase of what this website does and how it does it. This project section should be fairly meta, showing latest ci/cd build status, how I'm using GCP and firebase to secure it, how I'm using AI to build features, and generally show off all the cool things I'm doing on this site as a project to show off my tech skills
- The skills section should all be clickable and tell a story. So if a user clicks on ci/cd, it goes to a thing that shows how I did CI/CD on this website. It should be interactive and look fancy with cool animations and stuff

## Fun and silly things
* light mode flashbang. Easter egg, something like, "Do you hate dark mode? Click here for light mode" and flash the brightest thing possible for like 1 second and then revert to dark mode
