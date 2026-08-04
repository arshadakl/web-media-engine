# Silence Cutter

Browser-native video silence removal. No server, no upload — everything runs client-side.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite |
| UI | Tailwind CSS v4 + Motion |
| State | React hooks (useState/useMemo) |
| Voice Detection | Silero VAD (ONNX Runtime Web) |
| Audio Extraction | Web Audio API |
| AI Integration | Gemini API (optional) |
| Deploy | Cloudflare Pages |

## Processing Pipeline

```
Input Video
    ¦
    ?
+---------------------+
¦  File Ingestion     ¦  <input> or synthetic demo generator
+---------------------+
          ¦
          ?
+---------------------+
¦  Audio Extraction   ¦  Web Audio API decodeAudioData ? PCM
+---------------------+
          ¦
          ?
+---------------------+
¦  VAD Analysis       ¦  Silero VAD (ONNX) — speech/non-speech detection
¦  (20ms frames)      ¦  Hysteresis: prevents jitter at boundaries
+---------------------+
          ¦
          ?
+---------------------+
¦  Timeline Builder   ¦  VAD frames ? Segments ? EDL
¦  (rules engine)     ¦  4 rules: min silence, min speech, padding, merge
+---------------------+
          ¦
          ?
+---------------------+
¦  Interactive Edit   ¦  Click/drag on waveform to override cuts
¦  (preview player)   ¦  Seek-loop playback of keep segments
+---------------------+
          ¦
          ?
+---------------------+
¦  Export             ¦  Download processed audio/video
+---------------------+
          ¦
          ?
    Output File
```

## Development

### Prerequisites

- Bun (recommended) or Node.js

### Setup

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type check
bun run typecheck
```

### Environment Variables

Copy .env.example to .env.local and set your Gemini API key (optional):

```bash
GEMINI_API_KEY=your_api_key_here
```

## Deploy to Cloudflare Pages

### Via Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build and deploy
bun run build
wrangler pages deploy dist --project-name=silence-cutter
```

### Via GitHub Integration

1. Push to GitHub
2. Go to Cloudflare Dashboard ? Pages
3. Connect your repository
4. Set build command: bun run build
5. Set build output directory: dist
6. Deploy

## Project Structure

```
+-- core/                  # Core logic (framework-agnostic)
¦   +-- audio/             # Audio processing (extractor, chunker, RMS)
¦   +-- export/            # Export functionality
¦   +-- timeline/          # Timeline builder, EDL, merger
¦   +-- utils/             # Utilities (logger, memory guard, etc.)
¦   +-- vad/               # Voice Activity Detection (Silero VAD)
+-- src/
¦   +-- App.tsx            # Main application component
¦   +-- components/        # React UI components
¦   +-- main.tsx           # Entry point
¦   +-- types.ts           # TypeScript type definitions
+-- index.html             # HTML entry point
+-- vite.config.ts         # Vite configuration
+-- wrangler.toml          # Cloudflare Pages configuration
+-- package.json
```

## Browsers

- Chrome / Edge
- Firefox
- Safari
