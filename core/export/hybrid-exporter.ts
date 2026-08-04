import { EditEntry } from '../timeline/timeline-types';
import { logger } from '../utils/logger';

export interface ExportProgress {
  currentStep: string;
  percent: number;
  processedSegments: number;
  totalSegments: number;
  currentSegmentTimeMs: number;
  totalKeepDurationMs: number;
}

export interface ExportOptions {
  mimeType?: string; // e.g. 'video/webm;codecs=vp9,opus' or 'video/mp4'
  videoBitrate?: number; // e.g. 5_000_000 (5 Mbps)
  audioBitrate?: number; // e.g. 192_000 (192 kbps)
}

export class HybridExporter {
  public async renderVideoFromEDL(
    videoElement: HTMLVideoElement,
    edlEntries: EditEntry[],
    options: ExportOptions = {},
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Blob> {
    const keepEntries = edlEntries.filter((e) => e.action === 'keep');
    if (keepEntries.length === 0) {
      throw new Error('No keep segments found to export.');
    }

    const totalKeepDurationMs = keepEntries.reduce((sum, e) => sum + e.durationMs, 0);
    logger.info('HybridExporter', `Starting export of ${keepEntries.length} keep segments (${(totalKeepDurationMs / 1000).toFixed(1)}s total)`);

    // Determine recording MIME type
    const mimeType = this.getSupportedMimeType(options.mimeType);
    logger.info('HybridExporter', `Using MIME type for MediaRecorder: ${mimeType}`);

    // Create offscreen video canvas matching source resolution
    const canvas = document.createElement('canvas');
    const width = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Unable to create 2D canvas context for video rendering.');
    }

    // Set up Web Audio API stream capture
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioCtx();
    const sourceNode = audioCtx.createMediaElementSource(videoElement);
    const audioDest = audioCtx.createMediaStreamDestination();
    sourceNode.connect(audioDest);
    sourceNode.connect(audioCtx.destination); // For listening if unmuted

    // Create stream combining Canvas video + Web Audio destination stream
    const canvasStream = canvas.captureStream(30); // 30 fps
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioDest.stream.getAudioTracks(),
    ]);

    const recorderOptions: MediaRecorderOptions = {
      mimeType,
      videoBitsPerSecond: options.videoBitrate || 6_000_000, // 6 Mbps
      audioBitsPerSecond: options.audioBitrate || 192_000,
    };

    const mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
    const recordedChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    const exportPromise = new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, { type: mimeType });
        audioCtx.close();
        resolve(finalBlob);
      };
      mediaRecorder.onerror = (err) => {
        audioCtx.close();
        reject(err);
      };
    });

    // Start recording
    mediaRecorder.start(100);
    const wasMuted = videoElement.muted;
    videoElement.muted = false;

    let processedTimeMs = 0;

    for (let i = 0; i < keepEntries.length; i++) {
      const entry = keepEntries[i]!;
      const segmentStartSec = entry.startMs / 1000;
      const segmentEndSec = entry.endMs / 1000;

      if (onProgress) {
        onProgress({
          currentStep: `Processing segment ${i + 1} of ${keepEntries.length}`,
          percent: Math.round((processedTimeMs / totalKeepDurationMs) * 100),
          processedSegments: i + 1,
          totalSegments: keepEntries.length,
          currentSegmentTimeMs: processedTimeMs,
          totalKeepDurationMs,
        });
      }

      // Seek video to segment start
      videoElement.currentTime = segmentStartSec;
      await this.waitForSeek(videoElement);

      // Play through segment while capturing frames
      videoElement.play();

      await new Promise<void>((resolveSegment) => {
        const checkTime = () => {
          // Draw current video frame to canvas
          ctx.drawImage(videoElement, 0, 0, width, height);

          if (videoElement.currentTime >= segmentEndSec || videoElement.ended) {
            videoElement.pause();
            processedTimeMs += entry.durationMs;
            resolveSegment();
          } else {
            requestAnimationFrame(checkTime);
          }
        };
        requestAnimationFrame(checkTime);
      });
    }

    videoElement.pause();
    videoElement.muted = wasMuted;

    if (onProgress) {
      onProgress({
        currentStep: 'Finalizing video file...',
        percent: 100,
        processedSegments: keepEntries.length,
        totalSegments: keepEntries.length,
        currentSegmentTimeMs: totalKeepDurationMs,
        totalKeepDurationMs,
      });
    }

    mediaRecorder.stop();
    return await exportPromise;
  }

  private waitForSeek(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      if (Math.abs(video.currentTime - video.currentTime) < 0.01 && video.readyState >= 3) {
        resolve();
      } else {
        video.addEventListener('seeked', onSeeked);
      }
    });
  }

  private getSupportedMimeType(userPreferred?: string): string {
    if (userPreferred && MediaRecorder.isTypeSupported(userPreferred)) {
      return userPreferred;
    }
    const candidates = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }
}
