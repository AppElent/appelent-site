// Builds the export zip off the main thread (APP-608): compressing a large
// export would otherwise freeze the page for seconds.
import type { AppExport } from './export.ts'
import { buildZip } from './export.ts'

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<AppExport[]>) => void) | null
  postMessage: (message: unknown, transfer: Transferable[]) => void
}

scope.onmessage = (event) => {
  const data = buildZip(event.data)
  scope.postMessage(data, [data.buffer])
}
