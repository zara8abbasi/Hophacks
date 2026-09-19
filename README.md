# HopHacks

HopHacks is a Baltimore-focused web app that helps residents figure out how to dispose of everyday items and (in later releases) find nearby recycling and drop-off centers using Open Baltimore data.

## This release

- Home screen with three ways to describe an item: **Take A Picture**, **Type A Description**, and **Use Speech Input**
- Placeholder flows for camera capture, typed descriptions, and browser speech recognition
- Warm beige → forest green gradient UI with grain texture (Next.js, TypeScript, Tailwind, shadcn/ui)

- **Type A Description** (`/type`): sends your text to Grok (xAI) for object identification and classification (category + class). Camera and speech flows are still placeholders.

Other API integrations (ElevenLabs, Open Baltimore) are not wired yet.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43123](http://localhost:43123).

### Grok API key (optional)

Copy `.env.example` to `.env.local` and set `XAI_API_KEY` (or `GROK_API_KEY`) from your [xAI console](https://console.x.ai/). Without a key, `/type` uses a local mock classifier and shows a banner on the results screen.

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start dev server (43123) |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run lint` | Run ESLint               |
