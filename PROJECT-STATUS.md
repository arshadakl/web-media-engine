# Web Media Engine - Project Status

## Overview

A browser-native video silence removal app built with Nuxt 3, Vue 3, TypeScript, ffmpeg.wasm, Silero VAD, and Web Workers. All processing runs client-side with no server.

## Architecture

- **Framework:** Nuxt 3 (SSG mode)
- **State Management:** Pinia
- **Styling:** Tailwind CSS + shadcn-vue
- **Processing:** ffmpeg.wasm, ONNX Runtime Web
- **VAD:** Silero VAD via ONNX
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Deployment:** Cloudflare Pages

## Phase Completion Status

| Phase | Description                                | Status      | Tests |
| ----- | ------------------------------------------ | ----------- | ----- |
| 0     | Foundation (Nuxt, TS, ESLint, etc.)        | ✅ Complete | -     |
| 1     | Core Utilities (logger, memory, etc.)      | ✅ Complete | 67    |
| 2     | Audio Pipeline (chunker, RMS, ring buffer) | ✅ Complete | 43    |
| 3     | VAD Engine (ONNX runner, Silero)           | ✅ Complete | 14    |
| 4     | Timeline & EDL (builder, rules, export)    | ✅ Complete | 28    |
| 5     | Interactive Preview (seek, cut editor)     | ✅ Complete | 23    |
| 6     | Hybrid Export (keyframe, stream copy)      | ✅ Complete | 19    |
| 7     | Polish & Hardening (errors, a11y, loader)  | ✅ Complete | 20    |
| 8     | E2E Testing & Validation                   | ✅ Complete | 5     |
| 9     | Performance Optimization                   | ✅ Complete | 24    |

**Total: 243 unit tests passing**

## Core Modules

### `core/utils/`

- `logger.ts` - Logging with levels and production buffering
- `memory-guard.ts` - Memory monitoring and adaptive chunk sizing
- `browser-compat.ts` - Runtime detection and capability checks
- `worker-manager.ts` - Pooled worker manager with crash recovery
- `cache.ts` - IndexedDB cache with versioned keys

### `core/audio/`

- `chunker.ts` - File Manager (FSA + File API fallback)
- `ring-buffer.ts` - Circular FIFO ring buffer
- `rms.ts` - RMS/peak computation for waveforms

### `core/vad/`

- `vad-types.ts` - VAD type definitions
- `onnx-runner.ts` - ONNX Runtime wrapper
- `silero.ts` - Silero VAD with hysteresis

### `core/timeline/`

- `timeline-types.ts` - Segment and rule types
- `rules.ts` - Composable rule functions
- `edl.ts` - EDL generator and validator

### `core/preview/`

- `seek-engine.ts` - Navigate between keep segments
- `cut-editor.ts` - Toggle/apply overrides
- `stats.ts` - Compute time saved and format durations

### `core/export/`

- `keyframe-probe.ts` - Parse ffprobe output, find keyframes
- `hybrid-exporter.ts` - Generate export plan (copy/reencode)
- `stream-copy.ts` - FFmpeg commands for stream copying
- `output-delivery.ts` - FSA/Blob download with 2GB warning
- `validate.ts` - Output validation and timestamp checks

### `core/errors/`

- `index.ts` - Typed error classes with UI config

### `core/a11y/`

- `index.ts` - ARIA labels, keyboard shortcuts

### `core/browser/`

- `compat.ts` - Capability detection, Safari/Firefox fixes

### `core/engine/`

- `loader.ts` - Lazy load FFmpeg/ONNX/Silero

### `core/perf/`

- `monitor.ts` - Performance metrics and budget checking
- `memory.ts` - Memory snapshots and pressure detection
- `worker-pool.ts` - Worker pool optimization

## Performance Budget

| Metric                   | Target  |
| ------------------------ | ------- |
| First interactive (cold) | < 3s    |
| First interactive (warm) | < 1s    |
| VAD 1hr audio (8-core)   | < 4min  |
| Export 1hr (copy-heavy)  | < 5min  |
| Export 1hr (re-encode)   | < 20min |
| Waveform FPS             | ≥ 60fps |
| EDL recompute            | < 50ms  |
| Peak RAM 2GB export      | < 600MB |

## Git History

```
cf96f35 feat: implement performance monitoring and optimization
a18afee feat: implement E2E testing and output validation
ce69a8a feat: implement polish, performance and hardening modules
ad42748 feat: implement hybrid export engine
0a6442e feat: implement interactive preview engine
60e4520 feat: implement timeline engine and EDL generator
beec5bf feat: implement VAD engine with ONNX runner and hysteresis
1d49c3e feat: implement audio pipeline core modules
a0f1963 feat: implement core utilities with tests
5c0488e chore: switch from npm to pnpm
```

## Next Steps (Optional)

1. Implement Vue components for UI
2. Create Pinia stores for state management
3. Build Worker integrations
4. Complete E2E test coverage
5. Deploy to Cloudflare Pages
