// ── WebGL context release ─────────────────────────────────────────────────────
// Browsers keep only ~16 WebGL contexts alive and silently kill the oldest
// beyond that, so a figure frees its context when it unmounts instead of
// waiting for garbage collection.
//
// The release is deferred one tick: React's development remount unmounts and
// remounts the same canvas at once, and that canvas must keep its context.
// Call `claimContext` when (re)mounting and `releaseContext` in the cleanup.

const pending = new WeakMap<HTMLCanvasElement, ReturnType<typeof setTimeout>>();

/** Cancels a pending release of this canvas's context (it is mounting again). */
export function claimContext(canvas: HTMLCanvasElement) {
  clearTimeout(pending.get(canvas));
  pending.delete(canvas);
}

/** Frees the context on the next tick unless the canvas is claimed again. */
export function releaseContext(canvas: HTMLCanvasElement, gl: WebGLRenderingContext | WebGL2RenderingContext) {
  pending.set(canvas, setTimeout(() => {
    pending.delete(canvas);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }, 0));
}
