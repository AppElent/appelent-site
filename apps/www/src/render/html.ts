// A tiny escaping template tag: interpolated values are HTML-escaped unless
// they are already `Html` (the result of another `html` call or `raw`).
// Arrays are joined; null, undefined and false render nothing.

export interface Html {
  readonly __html: string
}

const entities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => entities[ch] ?? ch)
}

export function raw(value: string): Html {
  return { __html: value }
}

function isHtml(value: unknown): value is Html {
  return typeof value === 'object' && value !== null && '__html' in value
}

function render(value: unknown): string {
  if (value === null || value === undefined || value === false) return ''
  if (Array.isArray(value)) return value.map(render).join('')
  if (isHtml(value)) return value.__html
  return escapeHtml(String(value))
}

export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Html {
  let out = strings[0] ?? ''
  for (let i = 0; i < values.length; i++) {
    out += render(values[i]) + (strings[i + 1] ?? '')
  }
  return { __html: out }
}

/** An HTML comment that marks a placeholder for Eric in the page source. */
export function placeholderComment(item: string, what: string): Html {
  return raw(`<!-- PLACEHOLDER (${escapeHtml(item)}): ${escapeHtml(what)} -->`)
}
