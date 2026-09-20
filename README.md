# HopHacks

HopHacks is a Baltimore-focused web app that helps residents figure out how to dispose of everyday items and find nearby recycling and drop-off centers using Open Baltimore data.

## This release

- Home screen with three ways to input an item: **Take A Picture**, **Type A Description**, and **Use Speech Input**
- Camera capture, typed descriptions, and speech recording with transcription + Grok classification
- Warm beige → forest green gradient UI with grain texture (Next.js, TypeScript, Tailwind, shadcn/ui)

- **Type A Description** (`/type`): sends your text to Grok (xAI) for object identification and classification (category + class).
- **Use Speech Input** (`/speech`): records audio in the browser, transcribes with ElevenLabs Scribe on the server when `ELEVENLABS_API_KEY` is set (falls back to Web Speech API in Chrome), then runs the same Grok classification as `/type`. After you confirm the item, the app reads **one sentence** saying where to recycle or dispose (curbside recycle, drop-off, trash, compost, or HHW). TTS uses ElevenLabs when the same key is set, otherwise `speechSynthesis`. Photo and type flows stay silent.
- **Take A Picture** (`/picture`): captures a photo and sends it to Grok vision for the same classification shape (mock when no API key).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43123](http://localhost:43123).

### API keys (optional)

Copy `.env.example` to `.env.local`:

| Variable | Used for |
| -------- | -------- |
| `ELEVENLABS_API_KEY` | ElevenLabs Scribe STT and one-sentence TTS on the voice path (never sent to the browser). Without it, `/speech` uses browser speech recognition and `speechSynthesis` where supported. |
| `XAI_API_KEY` or `GROK_API_KEY` | Grok classification on `/type`, `/speech`, and `/picture`. Without a key, those routes use a local mock classifier and show a banner on the results screen. |

Get ElevenLabs keys from [ElevenLabs](https://elevenlabs.io/) and xAI keys from the [xAI console](https://console.x.ai/).

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start dev server (43123) |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run lint` | Run ESLint               |
