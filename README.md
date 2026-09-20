# HopHacks

HopHacks is a Baltimore-focused web app that helps residents figure out how to dispose of everyday items and find nearby recycling and drop-off centers using Open Baltimore data.

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
