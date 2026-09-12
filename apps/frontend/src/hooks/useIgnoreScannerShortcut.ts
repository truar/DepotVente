import { useEffect } from 'react'

// Barcode scanners are keyboard wedges: they type the code, then a terminator.
// A scanner whose suffix is CR+LF sends the LF as Ctrl+J — which is the
// browser's "open Downloads" shortcut, so every scan also opened a Downloads
// tab in Edge. Cancelling the keydown drops the browser's shortcut and leaves
// the scanned characters alone.
//
// Reconfiguring the scanner to terminate with CR only is the real fix (see the
// runbook); this guard is what protects a computer whose scanner comes back
// mis-configured. Mounted once, on the root route: the stray Ctrl+J arrives
// whatever has the focus, including no field at all.
export function useIgnoreScannerShortcut() {
  useEffect(() => {
    const ignoreCtrlJ = (event: KeyboardEvent) => {
      if (event.altKey) return
      if (!event.ctrlKey && !event.metaKey) return
      if (event.key.toLowerCase() !== 'j') return
      event.preventDefault()
    }
    // Capture: no screen should be able to swallow it first.
    window.addEventListener('keydown', ignoreCtrlJ, true)
    return () => window.removeEventListener('keydown', ignoreCtrlJ, true)
  }, [])
}
