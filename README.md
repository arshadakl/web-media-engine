# Web Media Engine

Browser-native video silence removal. No server, no upload — everything runs client-side.

**Core principle:** `core/` has zero dependency on Vue, Nuxt, or any UI framework. Workers import from `core/`. Vue imports only from `composables/` and `stores/`.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Nuxt 3 (SSG, `ssr: false`) |
| UI | Vue 3 + shadcn-vue + Tailwind CSS |
| State | Pinia |
| Audio Extraction | ffmpeg.wasm |
| Voice Detection | Silero VAD (ONNX Runtime Web) |
| Workers | Web Workers (pooled, typed message contracts) |
| Rendering | Canvas / WebGL / OffscreenCanvas |
| Deploy | Cloudflare Pages |
| Browsers | Chrome, Firefox, Safari |

## Processing Pipeline

```
Input Video (up to 10GB)
    │
    ▼
┌─────────────────────┐
│  File Ingestion     │  File System Access API / <input> fallback
│  (streaming chunks) │  Never loads full file into RAM
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Audio Extraction   │  ffmpeg.wasm → PCM 16kHz mono
│  (ffmpeg.wasm)      │  Lazy-loaded, cached in IndexedDB
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  VAD Analysis       │  Silero VAD (ONNX) in N parallel workers
│  (20ms frames)      │  Hysteresis: speech/non-speech with confidence
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Timeline Builder   │  VAD frames → Segments → EDL
│  (rules engine)     │  5 pure rules: filter, compress, pad, merge
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Interactive Edit   │  Click/drag on waveform to override cuts
│  (preview player)   │  Seek-loop playback of keep segments
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Hybrid Export      │  Stream-copy where keyframes align
│  (ffmpeg.wasm)      │  Re-encode only affected GOP at cut boundaries
└─────────┬───────────┘
          │
          ▼
    Output Video (.mp4)
```

## Algorithms

### Silence Detection (Silero VAD)

Silero VAD processes 512-sample windows (32ms at 16kHz). Each frame outputs `speechProb ∈ [0,1]`.

**Hysteresis logic:**
- Speech → Non-speech: requires `speechProb < 0.35` for 3+ consecutive frames
- Non-speech → Speech: requires `speechProb > 0.75` for 1 frame

This prevents jitter at speech boundaries.

**Parallel processing:**
Audio is split into N segments (N = `hardwareConcurrency - 2`). Each segment overlaps by 500ms with neighbors. Overlap regions are discarded from the later segment after VAD, preventing boundary artifacts.

### Timeline Rules Engine

5 pure functions applied sequentially to `Segment[]`:

1. **Min silence filter** — discard silence < `minSilenceMs` (600ms default)
2. **Min speech filter** — discard speech < `minSpeechMs` (100ms default, clicks/pops)
3. **Pause compression** — shorten medium silences (600-1200ms) to `targetPauseDuration` (250ms)
4. **Context padding** — expand speech segments by `paddingMs` (150ms) each side
5. **Merge nearby** — join speech segments closer than `mergeGapMs` (300ms)

### Hybrid Export Strategy

For each `keep` segment in the EDL:
1. Probe keyframes with `ffprobe`
2. If segment start/end aligns with keyframes → **stream copy** (no quality loss)
3. If segment start/end falls mid-GOP → **re-encode only that GOP**, then trim

Output is concatenated with FFmpeg concat demuxer. Result: near-lossless quality with minimal re-encoding.

## Performance Budget

| Metric | Target |
|--------|--------|
| Cold load (10 Mbps) | < 3s |
| Warm load (cached) | < 1s |
| VAD 1hr audio (8-core) | < 4min |
| Export 1hr (copy-heavy) | < 5min |
| Export 1hr (re-encode) | < 20min |
| Waveform FPS | ≥ 60fps |
| EDL recompute | < 50ms |
| Peak RAM (2GB export) | < 600MB |

## Development

```bash
npm install
npm run dev          # Start dev server
npm run build        # Static build
npm run test:unit    # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```
