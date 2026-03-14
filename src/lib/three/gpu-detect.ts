export type GpuTier = 1 | 2 | 3;

const CACHE_KEY = 'mps-gpu-tier';

/**
 * Detect GPU capability by running a small WebGL FPS test.
 * Returns tier 1 (full), 2 (reduced), or 3 (no WebGL).
 * Result is cached in sessionStorage.
 */
export async function detectGpuTier(): Promise<GpuTier> {
  if (typeof sessionStorage !== 'undefined') {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached === '1' || cached === '2' || cached === '3') {
      return Number(cached) as GpuTier;
    }
  }

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    cacheTier(3);
    return 3;
  }

  const tier = await runFpsBenchmark(gl as WebGLRenderingContext, canvas);
  cacheTier(tier);
  return tier;
}

function cacheTier(tier: GpuTier): void {
  try {
    sessionStorage.setItem(CACHE_KEY, String(tier));
  } catch {
    // sessionStorage unavailable
  }
}

function runFpsBenchmark(gl: WebGLRenderingContext, canvas: HTMLCanvasElement): Promise<GpuTier> {
  return new Promise((resolve) => {
    canvas.width = 256;
    canvas.height = 256;

    let frames = 0;
    const startTime = performance.now();
    const targetFrames = 10;

    function tick() {
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      frames++;

      if (frames >= targetFrames) {
        const elapsed = performance.now() - startTime;
        const fps = (frames / elapsed) * 1000;
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
        resolve(fps >= 30 ? 1 : 2);
        return;
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}
