// Web Locks (navigator.locks), which jsdom lacks. In a browser one lock
// manager serves every tab and worker of the origin; here it serves every
// sync service a story starts. Exclusive locks only, granted in request
// order; `ifAvailable` gets null instead of waiting, as in a browser.
//
// setup.ts installs a fresh one before each story: a story that ends while
// a sync still holds a lock (a push the server never answered) does not
// block the next one.
type Grant = { name: string } | null

export function aLockManager() {
  const held = new Set<string>()
  const waiting = new Map<string, Array<() => void>>()

  async function request<T>(
    name: string,
    optionsOrCallback:
      | { ifAvailable?: boolean }
      | ((lock: Grant) => T | Promise<T>),
    maybeCallback?: (lock: Grant) => T | Promise<T>,
  ): Promise<T> {
    const options =
      typeof optionsOrCallback === 'function' ? {} : optionsOrCallback
    const callback =
      typeof optionsOrCallback === 'function'
        ? optionsOrCallback
        : maybeCallback
    if (!callback) throw new TypeError('A lock request needs a callback')

    if (held.has(name)) {
      if (options.ifAvailable) return callback(null)
      await new Promise<void>((resolve) => {
        waiting.set(name, [...(waiting.get(name) ?? []), resolve])
      })
    }
    held.add(name)
    try {
      return await callback({ name })
    } finally {
      // Handed straight to the next in line, or released.
      const next = waiting.get(name)?.shift()
      if (next) next()
      else held.delete(name)
    }
  }

  return { request }
}
