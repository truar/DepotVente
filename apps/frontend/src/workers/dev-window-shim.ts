// In `pnpm dev`, Vite's React Refresh wraps every .tsx module, the PDF
// documents included, and its runtime writes to `window`, which a worker
// does not have: the PDF worker would fail to start. A build carries no
// React Refresh. Imported first by the worker, before any document.
if (import.meta.env.DEV) {
  const scope = self as unknown as { window?: unknown }
  scope.window ??= self
}
