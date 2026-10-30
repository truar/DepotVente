import { create } from 'zustand'

type ErrorAlertOptions = {
  title?: string
  actionLabel?: string
  // Opened in a new tab, under the message.
  link?: { href: string; label: string }
}

interface ErrorAlertState {
  open: boolean
  title?: string
  description: string
  actionLabel?: string
  link?: { href: string; label: string }
  _show: (payload: { description: string } & ErrorAlertOptions) => void
  dismiss: () => void
}

export const useErrorAlertStore = create<ErrorAlertState>((set) => ({
  open: false,
  description: '',
  _show: ({ description, title, actionLabel, link }) =>
    set({ open: true, description, title, actionLabel, link }),
  dismiss: () => set({ open: false }),
}))

export function showErrorAlert(message: string, options?: ErrorAlertOptions) {
  useErrorAlertStore.getState()._show({ description: message, ...options })
}

export function dismissErrorAlert() {
  useErrorAlertStore.getState().dismiss()
}
