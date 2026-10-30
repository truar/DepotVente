// jsdom ships without types: only what dymo-framework.test.ts uses of it.
declare module 'jsdom' {
  export class JSDOM {
    constructor(
      html: string,
      options?: { url?: string; runScripts?: 'dangerously' | 'outside-only' },
    )
    readonly window: Window & typeof globalThis
  }
}
