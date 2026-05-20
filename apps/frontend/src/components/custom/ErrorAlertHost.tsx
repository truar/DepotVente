import { useEffect, useRef } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useErrorAlertStore } from '@/stores/errorAlertStore'

export function ErrorAlertHost() {
  const open = useErrorAlertStore((s) => s.open)
  const title = useErrorAlertStore((s) => s.title)
  const description = useErrorAlertStore((s) => s.description)
  const actionLabel = useErrorAlertStore((s) => s.actionLabel)
  const dismiss = useErrorAlertStore((s) => s.dismiss)

  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const isInsideDialog = (target: EventTarget | null) =>
      target instanceof Element &&
      !!target.closest('[data-slot="alert-dialog-content"]')

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInsideDialog(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Enter') {
        dismiss()
      }
    }

    const blockEvent = (e: Event) => {
      if (isInsideDialog(e.target)) return
      e.preventDefault()
      e.stopPropagation()
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keypress', blockEvent, true)
    window.addEventListener('keyup', blockEvent, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keypress', blockEvent, true)
      window.removeEventListener('keyup', blockEvent, true)
    }
  }, [open, dismiss])

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss()
      }}
    >
      <AlertDialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => {
          const previous = previouslyFocusedRef.current
          if (previous && document.body.contains(previous)) {
            e.preventDefault()
            previous.focus()
          }
          previouslyFocusedRef.current = null
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? 'Erreur'}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => dismiss()}>
            {actionLabel ?? 'OK'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
