// jsdom, keeping Node's own network classes.
//
// jsdom brings its own AbortController / AbortSignal, while fetch, Request
// and Response stay Node's (jsdom has none). Node's Request refuses a jsdom
// signal, so every request built in a test (msw intercepting the app's
// calls to the server) failed with "Expected signal to be an instance of
// AbortSignal". The network globals are kept as Node defines them; the
// rest is jsdom as before, Blob and File included (the printed PDFs are
// read back through jsdom's FileReader). Same idea as jest-fixed-jsdom.
import { builtinEnvironments } from 'vitest/environments'
import type { Environment } from 'vitest/environments'

const nodeNetworkGlobals = [
  'fetch',
  'Request',
  'Response',
  'Headers',
  'FormData',
  'AbortController',
  'AbortSignal',
  'ReadableStream',
  'WritableStream',
  'TransformStream',
  'TextEncoder',
  'TextDecoder',
  'structuredClone',
  'BroadcastChannel',
  'URL',
  'URLSearchParams',
] as const

export default {
  name: 'jsdom-with-node-network',
  transformMode: 'web',
  async setup(global: Record<string, unknown>, options) {
    const kept = Object.fromEntries(
      nodeNetworkGlobals.map((key) => [key, global[key]]),
    )
    const jsdom = await builtinEnvironments.jsdom.setup(global, options)
    Object.assign(global, kept)
    return jsdom
  },
} satisfies Environment
