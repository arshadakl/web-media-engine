export interface RMSResult {
  rmsValues: Float32Array;
  maxRms: number;
}

export function computeRMSFromPCM(pcmData: Float32Array, numBins: number): RMSResult {
  if (pcmData.length === 0 || numBins <= 0) {
    return { rmsValues: new Float32Array(0), maxRms: 0 };
  }

  const rmsValues = new Float32Array(numBins);
  const samplesPerBin = pcmData.length / numBins;
  let maxRms = 0;

  for (let b = 0; b < numBins; b++) {
    const start = Math.floor(b * samplesPerBin);
    const end = Math.min(pcmData.length, Math.floor((b + 1) * samplesPerBin));
    let sumSq = 0;
    const count = end - start;

    if (count > 0) {
      for (let i = start; i < end; i++) {
        const val = pcmData[i] || 0;
        sumSq += val * val;
      }
      const rms = Math.sqrt(sumSq / count);
      rmsValues[b] = rms;
      if (rms > maxRms) maxRms = rms;
    }
  }

  return { rmsValues, maxRms };
}
