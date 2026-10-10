import { create } from 'zustand'

// A new build of the application, downloaded by the service worker, waiting
// to take over this computer (see registerSW in main.tsx). Nothing switches
// on its own: the banner offers it and the operator picks the moment.
interface AppUpdateState {
  // Hands this computer to the new build: every tab of the app reloads onto
  // it. Null while no new build is waiting.
  apply: (() => void) | null
}

export const useAppUpdateStore = create<AppUpdateState>(() => ({
  apply: null,
}))

export function offerAppUpdate(apply: () => void) {
  useAppUpdateStore.setState({ apply })
}
