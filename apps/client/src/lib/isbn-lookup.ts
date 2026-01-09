/**
 * ISBN Lookup Service using Open Library API
 * https://openlibrary.org/dev/docs/api/books
 */

export interface BookMetadata {
  title: string;
  author: string;
  coAuthors?: string[];
  publisher?: string;
  publicationYear?: number;
  isbn10?: string;
  isbn13?: string;
  coverUrl?: string;
  pages?: number;
  subjects?: string[];
  description?: string;
}

interface OpenLibraryResponse {
  [key: string]: {
    title?: string;
    authors?: Array<{ name: string }>;
    publishers?: Array<{ name: string }>;
    publish_date?: string;
    number_of_pages?: number;
    subjects?: Array<{ name: string }>;
    cover?: {
      small?: string;
      medium?: string;
      large?: string;
    };
    identifiers?: {
      isbn_10?: string[];
      isbn_13?: string[];
    };
    notes?: string;
  };
}

/**
 * Normalize ISBN by removing hyphens and spaces
 */
export function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[-\s]/g, "");
}

/**
 * Validate ISBN-10 or ISBN-13 format
 */
export function isValidIsbn(isbn: string): boolean {
  const normalized = normalizeIsbn(isbn);
  return normalized.length === 10 || normalized.length === 13;
}

/**
 * Extract publication year from various date formats
 */
function extractYear(dateStr: string | undefined): number | undefined {
  if (!dateStr) return undefined;
  const match = dateStr.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : undefined;
}

/**
 * Lookup book metadata by ISBN using Open Library API
 */
export async function lookupIsbn(isbn: string): Promise<BookMetadata | null> {
  const normalized = normalizeIsbn(isbn);

  if (!isValidIsbn(normalized)) {
    throw new Error("Invalid ISBN format. Must be 10 or 13 digits.");
  }

  const bibKey = normalized.length === 13 ? `ISBN:${normalized}` : `ISBN:${normalized}`;
  const url = `https://openlibrary.org/api/books?bibkeys=${bibKey}&format=json&jscmd=data`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: OpenLibraryResponse = await response.json();
    const bookData = data[bibKey];

    if (!bookData) {
      return null; // Book not found
    }

    // Extract authors
    const authors = bookData.authors?.map((a) => a.name) || [];
    const [primaryAuthor, ...coAuthors] = authors;

    // Build metadata object
    const metadata: BookMetadata = {
      title: bookData.title || "Unknown Title",
      author: primaryAuthor || "Unknown Author",
      coAuthors: coAuthors.length > 0 ? coAuthors : undefined,
      publisher: bookData.publishers?.[0]?.name,
      publicationYear: extractYear(bookData.publish_date),
      pages: bookData.number_of_pages,
      subjects: bookData.subjects?.map((s) => s.name),
      coverUrl: bookData.cover?.large || bookData.cover?.medium || bookData.cover?.small,
      description: bookData.notes,
    };

    // Add ISBN identifiers
    if (bookData.identifiers?.isbn_10?.[0]) {
      metadata.isbn10 = bookData.identifiers.isbn_10[0];
    }
    if (bookData.identifiers?.isbn_13?.[0]) {
      metadata.isbn13 = bookData.identifiers.isbn_13[0];
    }

    // If we looked up by one ISBN format, ensure we have it
    if (normalized.length === 10 && !metadata.isbn10) {
      metadata.isbn10 = normalized;
    } else if (normalized.length === 13 && !metadata.isbn13) {
      metadata.isbn13 = normalized;
    }

    return metadata;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to lookup ISBN");
  }
}

/**
 * Get cover image URL from ISBN (alternative method using covers API)
 */
export function getCoverUrlFromIsbn(isbn: string, size: "S" | "M" | "L" = "M"): string {
  const normalized = normalizeIsbn(isbn);
  return `https://covers.openlibrary.org/b/isbn/${normalized}-${size}.jpg`;
}
