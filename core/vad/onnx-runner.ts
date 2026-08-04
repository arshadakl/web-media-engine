import { logger } from '../utils/logger';

export interface InferenceSessionOptions {
  modelPath?: string;
}

export class SileroOnnxRunner {
  private session: unknown = null;
  private isLoaded = false;
  private hState: Float32Array = new Float32Array(2 * 1 * 64); // 2 layers, 1 batch, 64 dimension
  private cState: Float32Array = new Float32Array(2 * 1 * 64);

  constructor() {
    this.resetState();
  }

  public resetState() {
    this.hState.fill(0);
    this.cState.fill(0);
  }

  public async loadModel(modelUrl = '/models/silero_vad.onnx'): Promise<boolean> {
    try {
      const ort = await import('onnxruntime-web');
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.wasmPaths = { 'ort-wasm-simd-threaded.wasm': '/ort-wasm.wasm' };

      this.session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
      this.isLoaded = true;
      logger.info('SileroOnnxRunner', 'Silero VAD ONNX model loaded successfully');
      return true;
    } catch (err) {
      logger.warn('SileroOnnxRunner', 'ONNX model load failed, falling back to hybrid DSP VAD', err);
      this.isLoaded = false;
      return false;
    }
  }

  public isReady(): boolean {
    return this.isLoaded;
  }

  public async runInference(pcm512: Float32Array, sampleRate = 16000): Promise<number> {
    if (!this.isLoaded || !this.session) {
      // Fallback: calculate high-precision RMS & zero-crossing energy
      return this.dspFallbackProbability(pcm512, sampleRate);
    }

    try {
      const ort = await import('onnxruntime-web');
      const inputTensor = new ort.Tensor('float32', pcm512, [1, 512]);
      const srTensor = new ort.Tensor('int64', BigInt64Array.from([BigInt(sampleRate)]), [1]);
      const hTensor = new ort.Tensor('float32', this.hState, [2, 1, 64]);
      const cTensor = new ort.Tensor('float32', this.cState, [2, 1, 64]);

      const feeds = {
        input: inputTensor,
        sr: srTensor,
        h: hTensor,
        c: cTensor,
      };

      const results = await (this.session as { run: (feeds: unknown) => Promise<Record<string, { data: Float32Array }>> }).run(feeds);
      
      const output = results.output?.data[0] ?? 0;
      if (results.hn && results.cn) {
        this.hState.set(results.hn.data);
        this.cState.set(results.cn.data);
      }
      return output;
    } catch (err) {
      logger.error('SileroOnnxRunner', 'ONNX inference error, switching to fallback DSP', err);
      return this.dspFallbackProbability(pcm512, sampleRate);
    }
  }

  private dspFallbackProbability(pcm: Float32Array, sampleRate: number): number {
    let sumSq = 0;
    let zcrCount = 0;
    for (let i = 0; i < pcm.length; i++) {
      const val = pcm[i] || 0;
      sumSq += val * val;
      if (i > 0 && ((pcm[i]! >= 0 && pcm[i - 1]! < 0) || (pcm[i]! < 0 && pcm[i - 1]! >= 0))) {
        zcrCount++;
      }
    }
    const rms = Math.sqrt(sumSq / pcm.length);
    const zcr = zcrCount / pcm.length;

    // Normalised speech probability scoring
    const db = 20 * Math.log10(Math.max(rms, 1e-5));
    // Typical voice speech is above -40dB up to 0dB, noise floor -55dB
    let prob = (db + 48) / 30; // -48dB gives 0, -18dB gives 1.0
    if (zcr > 0.4) {
      // High frequency noise / hiss adjustment
      prob *= 0.8;
    }
    return Math.min(1.0, Math.max(0.0, prob));
  }
}
