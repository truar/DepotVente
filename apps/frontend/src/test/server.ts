// The server the app talks to: login, and the sync of the local base with
// the other computers. It answers nothing by default: a story declares the
// answers it needs with `server.use(...)` (msw handlers), and a request no
// story declared fails the test rather than leaving for the network.
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

export const server = setupServer(
  // The Dymo label template, fetched when a screen loads: there is no label
  // printer in the tests, and the app already carries on without it.
  http.get(
    '/article-label.label',
    () => new HttpResponse(null, { status: 404 }),
  ),
)
