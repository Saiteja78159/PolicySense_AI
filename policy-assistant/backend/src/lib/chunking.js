/**
 * Split text into overlapping chunks for RAG.
 * Tries to break on paragraph/sentence boundaries when possible.
 */
export function splitIntoChunks(text, chunkSize = 800, overlap = 100) {
  if (!text || typeof text !== 'string') return [];
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);
    let slice = normalized.slice(start, end);

    if (end < normalized.length) {
      const lastBreak = Math.max(
        slice.lastIndexOf('\n\n'),
        slice.lastIndexOf('. '),
        slice.lastIndexOf('.\n'),
        slice.lastIndexOf(' ')
      );
      if (lastBreak > chunkSize / 2) {
        slice = slice.slice(0, lastBreak + 1);
        end = start + lastBreak + 1;
      }
    }

    if (slice.trim()) chunks.push(slice.trim());
    start = end - (end < normalized.length ? overlap : 0);
  }

  return chunks;
}
