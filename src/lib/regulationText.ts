/** Convert legacy requirement content to readable text blocks, never executable HTML.
 * Entity decoding is supplied by the caller so the transformation is testable.
 * No URLs, attributes, or HTML nodes from the source are mounted in the page. */
export function regulationTextBlocks(value: string, decodeEntities: (value: string) => string) {
  const text = value
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(/\r\n?/g, '\n')
    .replace(/<(script|style|iframe|object|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<!--[^]*?-->/g, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|div|h[1-6]|ul|ol|blockquote|table|tr)\s*>/gi, '\n\n')
    .replace(/<li\b[^>]*>/gi, '\n')
    .replace(/<\/li\s*>/gi, '\n')
    .replace(/<\/(?:td|th)\s*>/gi, '\t')
    .replace(/<\/?[a-z][^>]*>/gi, '')
  // Some legacy paragraphs flatten genuine clause starts into one line.
  // Split only after a sentence/list boundary, followed by a clause marker
  // and capital prose. References such as "paragraph (a) of" stay inline.
  const readable = decodeEntities(text).replace(
    /(?<=[.!?;:\]])[ \t]+(?=\[?\((?:[a-z]|\d+|[ivxlcdm]+)\)[ \t]+[A-Z])/g,
    '\n',
  ).replace(/(?<=--)[ \t]+(?=\[?\((?:[a-z]|\d+|[ivxlcdm]+)\)[ \t]+[A-Z])/g, '\n')
  return readable.split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean)
    .flatMap((paragraph) => paragraph.split(/\n(?=\s*\[?\([a-z0-9]+\))/i))
    .map((text) => ({
      text,
      indent: /^\s*\(\d+\)/.test(text) ? 'number' : /^\s*\((?:i{1,3}|iv|vi{0,3}|ix|x)\)/i.test(text) ? 'roman' : 'none',
    }))
}

/** Parse only escaped text to decode entities. The parser never sees source tags. */
export function decodeRegulationEntities(text: string) {
  if (!text.includes('&')) return text
  return new DOMParser().parseFromString(text.replace(/</g, '&lt;').replace(/>/g, '&gt;'), 'text/html').body.textContent ?? ''
}
