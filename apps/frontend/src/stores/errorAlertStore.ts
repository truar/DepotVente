import { create } from 'zustand'

type ErrorAlertOptions = {
  title?: string
  actionLabel?: string
}

interface ErrorAlertState {
  open: boolean
  title?: string
  description: string
  actionLabel?: string
  _show: (payload: { description: string } & ErrorAlertOptions) => void
  dismiss: () => void
}

export const useErrorAlertStore = create<ErrorAlertState>((set) => ({
  open: false,
  description: '',
  _show: ({ description, title, actionLabel }) =>
    set({ open: true, description, title, actionLabel }),
  dismiss: () => set({ open: false }),
}))

export function showErrorAlert(message: string, options?: ErrorAlertOptions) {
  useErrorAlertStore.getState()._show({ description: message, ...options })
}

export function dismissErrorAlert() {
  useErrorAlertStore.getState().dismiss()
}
