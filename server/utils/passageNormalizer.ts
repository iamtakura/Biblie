/**
 * Passage normalization using the BCV (Bible Citation Validator) Parser.
 * npm: bible-passage-reference-parser
 *
 * Converts free-text Bible references (e.g. "Romans 7:14-25", "rom 7.14",
 * "the book of Romans chapter 7 verses 14 through 25") into a stable,
 * hyphenated slug used as the cache key (e.g. "romans-7-14-25").
 */

let _bcv: InstanceType<typeof import('bible-passage-reference-parser/esm/bcv_parser.js').bcv_parser> | null = null

async function getBcvParser() {
  if (_bcv) return _bcv

  // Dynamic import — BCV parser ESM modules
  const { bcv_parser } = await import('bible-passage-reference-parser/esm/bcv_parser.js' as string)
  const lang = await import('bible-passage-reference-parser/esm/lang/en.js' as string)

  _bcv = new bcv_parser(lang)

  // Configure to be lenient with partial references
  _bcv.set_options({
    osis_compaction_strategy: 'bcv',
    sequence_combination_strategy: 'separate',
  })

  return _bcv
}

/**
 * Converts an OSIS reference string (e.g. "Rom.7.14-Rom.7.25")
 * into a stable URL/cache-friendly slug (e.g. "romans-7-14-25").
 */
function osisToSlug(osis: string): string {
  // OSIS book codes → full lowercase names
  const bookMap: Record<string, string> = {
    Gen: 'genesis', Exod: 'exodus', Lev: 'leviticus', Num: 'numbers',
    Deut: 'deuteronomy', Josh: 'joshua', Judg: 'judges', Ruth: 'ruth',
    '1Sam': '1-samuel', '2Sam': '2-samuel', '1Kgs': '1-kings', '2Kgs': '2-kings',
    '1Chr': '1-chronicles', '2Chr': '2-chronicles', Ezra: 'ezra', Neh: 'nehemiah',
    Esth: 'esther', Job: 'job', Ps: 'psalms', Prov: 'proverbs', Eccl: 'ecclesiastes',
    Song: 'song-of-solomon', Isa: 'isaiah', Jer: 'jeremiah', Lam: 'lamentations',
    Ezek: 'ezekiel', Dan: 'daniel', Hos: 'hosea', Joel: 'joel', Amos: 'amos',
    Obad: 'obadiah', Jonah: 'jonah', Mic: 'micah', Nah: 'nahum', Hab: 'habakkuk',
    Zeph: 'zephaniah', Hag: 'haggai', Zech: 'zechariah', Mal: 'malachi',
    Matt: 'matthew', Mark: 'mark', Luke: 'luke', John: 'john', Acts: 'acts',
    Rom: 'romans', '1Cor': '1-corinthians', '2Cor': '2-corinthians', Gal: 'galatians',
    Eph: 'ephesians', Phil: 'philippians', Col: 'colossians', '1Thess': '1-thessalonians',
    '2Thess': '2-thessalonians', '1Tim': '1-timothy', '2Tim': '2-timothy', Titus: 'titus',
    Phlm: 'philemon', Heb: 'hebrews', Jas: 'james', '1Pet': '1-peter', '2Pet': '2-peter',
    '1John': '1-john', '2John': '2-john', '3John': '3-john', Jude: 'jude', Rev: 'revelation',
  }

  // Handle ranges like "Rom.7.14-Rom.7.25" → collapse to start ref
  const primary = osis.split('-')[0]! // take start of range for the slug
  const fullOsis = osis // keep full for verse extraction

  // Extract book, chapter, verse from OSIS
  // Pattern: BOOK.CHAPTER.VERSE[-BOOK.CHAPTER.VERSE]
  const parts = fullOsis.split('-')
  const startParts = parts[0]!.split('.')
  const endParts = parts[1]?.split('.')

  const startBook = startParts[0]!
  const startChapter = startParts[1]
  const startVerse = startParts[2]

  // Build slug: book-chapter-startverse[-endverse]
  const bookSlug = bookMap[startBook] ?? startBook.toLowerCase()
  let slug = bookSlug

  if (startChapter) slug += `-${startChapter}`
  if (startVerse) slug += `-${startVerse}`

  // Append end verse if range ends in same chapter
  if (endParts && endParts[2] && endParts[0] === startBook && endParts[1] === startChapter) {
    slug += `-${endParts[2]}`
  }

  return slug
}

/**
 * Parses a free-text query into a normalized passage_ref slug.
 *
 * Returns null if no recognizable Bible reference is found —
 * callers should treat null as a personal/non-passaage question.
 */
export async function normalizePassageRef(query: string): Promise<string | null> {
  try {
    const bcv = await getBcvParser()
    const result = bcv.parse(query)
    const osis = result.osis()

    if (!osis || osis.trim() === '') {
      return null
    }

    // Use the first reference found if multiple are detected
    const firstOsis = osis.split(',')[0]!.trim()
    return osisToSlug(firstOsis)
  } catch (err) {
    console.error('[PassageNormalizer] Error parsing reference:', err)
    return null
  }
}

/**
 * Converts a normalized slug (e.g. "romans-7-14-25" or "1-corinthians-13")
 * into a human-readable display title (e.g. "Romans 7:14-25" or "1 Corinthians 13").
 */
export function getDisplayTitleFromSlug(slug: string): string {
  // Maps slug prefix → display name (only entries that need special casing)
  const displayMap: Record<string, string> = {
    'genesis': 'Genesis', 'exodus': 'Exodus', 'leviticus': 'Leviticus',
    'numbers': 'Numbers', 'deuteronomy': 'Deuteronomy', 'joshua': 'Joshua',
    'judges': 'Judges', 'ruth': 'Ruth', 'ezra': 'Ezra', 'nehemiah': 'Nehemiah',
    'esther': 'Esther', 'job': 'Job', 'psalms': 'Psalms', 'proverbs': 'Proverbs',
    'ecclesiastes': 'Ecclesiastes', 'isaiah': 'Isaiah', 'jeremiah': 'Jeremiah',
    'lamentations': 'Lamentations', 'ezekiel': 'Ezekiel', 'daniel': 'Daniel',
    'hosea': 'Hosea', 'joel': 'Joel', 'amos': 'Amos', 'obadiah': 'Obadiah',
    'jonah': 'Jonah', 'micah': 'Micah', 'nahum': 'Nahum', 'habakkuk': 'Habakkuk',
    'zephaniah': 'Zephaniah', 'haggai': 'Haggai', 'zechariah': 'Zechariah',
    'malachi': 'Malachi', 'matthew': 'Matthew', 'mark': 'Mark', 'luke': 'Luke',
    'john': 'John', 'acts': 'Acts', 'romans': 'Romans', 'galatians': 'Galatians',
    'ephesians': 'Ephesians', 'philippians': 'Philippians', 'colossians': 'Colossians',
    'titus': 'Titus', 'philemon': 'Philemon', 'hebrews': 'Hebrews', 'james': 'James',
    'jude': 'Jude', 'revelation': 'Revelation',
    // Numbered books
    '1-samuel': '1 Samuel', '2-samuel': '2 Samuel',
    '1-kings': '1 Kings', '2-kings': '2 Kings',
    '1-chronicles': '1 Chronicles', '2-chronicles': '2 Chronicles',
    '1-corinthians': '1 Corinthians', '2-corinthians': '2 Corinthians',
    '1-thessalonians': '1 Thessalonians', '2-thessalonians': '2 Thessalonians',
    '1-timothy': '1 Timothy', '2-timothy': '2 Timothy',
    '1-peter': '1 Peter', '2-peter': '2 Peter',
    '1-john': '1 John', '2-john': '2 John', '3-john': '3 John',
    // Multi-word book
    'song-of-solomon': 'Song of Solomon',
  }

  const parts = slug.split('-')

  // Try progressively shorter prefixes to find the book name in the map.
  // "song-of-solomon-3-1" → try "song-of-solomon-3-1", then "song-of-solomon-3", etc.
  let bookSlug = ''
  let bookName = ''

  for (let len = parts.length; len >= 1; len--) {
    const candidate = parts.slice(0, len).join('-')
    if (displayMap[candidate] !== undefined) {
      bookSlug = candidate
      bookName = displayMap[candidate]
      break
    }
  }

  // Fallback: the first non-numeric segment(s) form the book name
  if (!bookName) {
    let endIdx = 0
    for (let i = 0; i < parts.length; i++) {
      if (/^\d+$/.test(parts[i]!) && i > 0) break
      endIdx = i
    }
    bookSlug = parts.slice(0, endIdx + 1).join('-')
    // Title-case each word
    bookName = bookSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  const numParts = slug.slice(bookSlug.length).replace(/^-/, '').split('-').filter(Boolean)

  if (numParts.length === 0) return bookName
  if (numParts.length === 1) return `${bookName} ${numParts[0]}`
  if (numParts.length === 2) return `${bookName} ${numParts[0]}:${numParts[1]}`
  // Range: chapter-startVerse-endVerse
  return `${bookName} ${numParts[0]}:${numParts[1]}-${numParts[2]}`
}
