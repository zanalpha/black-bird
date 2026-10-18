import { isTransaction } from '@/lib/finance'
import { isTombstone, mergeLedger, type LedgerBook } from '@/lib/ledger-sync'

// Keep this topic identical to scripts/sync_ledger.py in zanalpha/black-bird-book.
const LEDGER_TOPIC = 'bbird-bcf9e2ba1a87435005e38f710acbb251'
const NTFY_URL = `https://ntfy.sh/${LEDGER_TOPIC}`
const GITHUB_URL =
  'https://api.github.com/repos/zanalpha/black-bird-book/contents/ledger.json'

const unreadable = 'Buku kas bersama tidak bisa dibaca.'
const GITHUB_CACHE_MS = 90_000

export type RemoteLedger = LedgerBook & {
  sha: string | null
}

type ReadResult =
  | { state: 'book'; book: RemoteLedger }
  | { state: 'empty' }
  | { state: 'down' }

type NtfyMessage = {
  id?: string
  time?: number
  event?: string
  message?: string
  attachment?: {
    url?: string
    expires?: number
  }
}

type GithubCache = {
  until: number
  result: ReadResult
}

let githubCache: GithubCache | null = null

function parseBook(value: unknown): LedgerBook {
  if (!value || typeof value !== 'object') {
    throw new Error(unreadable)
  }
  const row = value as { transactions?: unknown; deleted?: unknown }
  if (!Array.isArray(row.transactions) || !Array.isArray(row.deleted)) {
    throw new Error(unreadable)
  }
  const transactions = row.transactions.filter(isTransaction)
  if (row.transactions.length > 0 && transactions.length === 0) {
    throw new Error(unreadable)
  }
  return { transactions, deleted: row.deleted.filter(isTombstone) }
}

function decodeGithubContent(content: string) {
  const raw = atob(content.replace(/\s+/gu, ''))
  const bytes = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index)
  }
  return new TextDecoder().decode(bytes)
}

async function readNtfy(): Promise<ReadResult> {
  let response: Response
  try {
    response = await fetch(`${NTFY_URL}/json?poll=1&since=12h`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    })
  } catch {
    return { state: 'down' }
  }
  if (!response.ok) return { state: 'down' }

  let messages: NtfyMessage[] = []
  try {
    const text = await response.text()
    messages = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as NtfyMessage)
  } catch {
    return { state: 'down' }
  }

  const now = Date.now() / 1000
  const live = messages
    .filter((message) => {
      const expires = message.attachment?.expires
      return (
        message.event === 'message' &&
        typeof message.attachment?.url === 'string' &&
        typeof expires === 'number' &&
        expires > now
      )
    })
    .sort((a, b) => (a.time ?? 0) - (b.time ?? 0))

  for (let index = live.length - 1; index >= 0; index -= 1) {
    const message = live[index]
    const url = message.attachment?.url
    if (!url) continue
    try {
      const file = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(12_000),
      })
      if (!file.ok) continue
      const book = parseBook((await file.json()) as unknown)
      return {
        state: 'book',
        book: { ...book, sha: typeof message.id === 'string' ? message.id : null },
      }
    } catch (error) {
      if (error instanceof Error && error.message === unreadable) continue
      continue
    }
  }

  return { state: 'empty' }
}

async function readGithub(): Promise<ReadResult> {
  if (githubCache && githubCache.until > Date.now()) return githubCache.result

  let response: Response
  try {
    response = await fetch(GITHUB_URL, {
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(12_000),
    })
  } catch {
    return { state: 'down' }
  }

  const remember = (result: ReadResult, ttl: number) => {
    githubCache = { until: Date.now() + ttl, result }
    return result
  }

  if (response.status === 404) return remember({ state: 'empty' }, GITHUB_CACHE_MS)
  if (response.status === 403 || response.status === 429) {
    return remember({ state: 'down' }, 10 * 60 * 1000)
  }
  if (!response.ok) return { state: 'down' }

  try {
    const payload = (await response.json()) as {
      content?: string
      encoding?: string
      sha?: string
    }
    if (payload.encoding !== 'base64' || typeof payload.content !== 'string') {
      return remember({ state: 'down' }, GITHUB_CACHE_MS)
    }
    const book = parseBook(JSON.parse(decodeGithubContent(payload.content)) as unknown)
    return remember(
      {
        state: 'book',
        book: { ...book, sha: typeof payload.sha === 'string' ? payload.sha : null },
      },
      GITHUB_CACHE_MS,
    )
  } catch {
    return remember({ state: 'down' }, GITHUB_CACHE_MS)
  }
}

export async function fetchLedger(): Promise<RemoteLedger> {
  const [ntfy, github] = await Promise.all([readNtfy(), readGithub()])
  const ntfyBook = ntfy.state === 'book' ? ntfy.book : null
  const githubBook = github.state === 'book' ? github.book : null

  if (!ntfyBook && !githubBook) {
    if (ntfy.state === 'down' && github.state === 'down') {
      throw new Error('Buku kas bersama belum tersambung.')
    }
    return { transactions: [], deleted: [], sha: null }
  }

  if (ntfyBook && githubBook) {
    return {
      ...mergeLedger(
        ntfyBook.transactions,
        ntfyBook.deleted,
        githubBook.transactions,
        githubBook.deleted,
      ),
      sha: ntfyBook.sha,
    }
  }

  return (ntfyBook ?? githubBook) as RemoteLedger
}

async function publishBook(book: LedgerBook) {
  const response = await fetch(NTFY_URL, {
    method: 'PUT',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Filename: 'ledger.json',
    },
    body: JSON.stringify({
      transactions: book.transactions,
      deleted: book.deleted,
    }),
    signal: AbortSignal.timeout(12_000),
  })
  if (!response.ok) throw new Error('Buku kas bersama belum tersimpan.')
  const payload = (await response.json()) as { id?: string }
  if (typeof payload.id !== 'string' || payload.id.length === 0) {
    throw new Error('Buku kas bersama belum tersimpan.')
  }
  return payload.id
}

export async function saveLedger(book: LedgerBook, baseId: string | null) {
  const current = await readNtfy()
  if (current.state === 'down') throw new Error('Buku kas bersama belum tersimpan.')
  if (current.state === 'book' && baseId && current.book.sha !== baseId) {
    throw new Error('conflict')
  }
  return publishBook(book)
}
