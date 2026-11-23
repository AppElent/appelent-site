// The account portal contract (developer-home standards/account-portal.md,
// version 1.0.0): what each app's `convex/accountPortal.ts` returns. Every
// response is checked here before the UI sees it; anything else counts as the
// app being unreachable.

export const SUPPORTED_CONTRACTS = [1] as const
export type Contract = (typeof SUPPORTED_CONTRACTS)[number]

export interface Count {
  /** Stable camelCase kind of data (`recipes`, `sets`). */
  key: string
  count: number
  /** `count` is a floor: capped at 1,000, or cut short near the read limits. */
  more: boolean
}

export interface Summary {
  contract: Contract
  /** Epoch ms of the caller's latest write, or null when the app does not track it. */
  lastActiveAt: number | null
  counts: Count[]
}

export interface ExportPage {
  contract: Contract
  app: string
  tables: Record<string, unknown[]>
  /** Opaque; the portal never parses it. Null when done. */
  next: string | null
}

/** A response that breaks the contract. The UI shows the app as unreachable. */
export class ContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContractError'
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function contractOf(value: Record<string, unknown>): Contract {
  const contract = value.contract
  if (!SUPPORTED_CONTRACTS.includes(contract as Contract)) {
    throw new ContractError(`Unknown contract ${String(contract)}`)
  }
  return contract as Contract
}

/** `null` means the person never used the app. */
export function parseSummary(value: unknown): Summary | null {
  if (value === null) return null
  if (!isRecord(value)) throw new ContractError('Summary is not an object')
  const contract = contractOf(value)
  const { lastActiveAt, counts } = value
  if (
    lastActiveAt !== null &&
    (typeof lastActiveAt !== 'number' ||
      Number.isNaN(new Date(lastActiveAt).getTime()))
  ) {
    throw new ContractError('lastActiveAt is not a timestamp or null')
  }
  if (!Array.isArray(counts)) throw new ContractError('counts is not a list')
  return {
    contract,
    lastActiveAt,
    counts: counts.map((item): Count => {
      if (
        !isRecord(item) ||
        typeof item.key !== 'string' ||
        typeof item.count !== 'number' ||
        !Number.isFinite(item.count) ||
        item.count < 0 ||
        typeof item.more !== 'boolean'
      ) {
        throw new ContractError('Malformed count')
      }
      return { key: item.key, count: item.count, more: item.more }
    }),
  }
}

export function parseExportPage(value: unknown, app: string): ExportPage {
  if (!isRecord(value)) throw new ContractError('Export page is not an object')
  const contract = contractOf(value)
  const { tables, next } = value
  if (value.app !== app)
    throw new ContractError('Export page names another app')
  if (next !== null && typeof next !== 'string') {
    throw new ContractError('next is not a string or null')
  }
  if (!isRecord(tables)) throw new ContractError('tables is not an object')
  for (const rows of Object.values(tables)) {
    if (!Array.isArray(rows)) throw new ContractError('A table is not a list')
  }
  return { contract, app, tables: tables as Record<string, unknown[]>, next }
}

/** The typed client each app gets. Real ones call Convex; tests use fakes. */
export interface PortalClient {
  summary(): Promise<Summary | null>
  exportPage(cursor: string | null): Promise<ExportPage>
}
