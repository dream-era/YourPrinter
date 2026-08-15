/**
 * lib/documents/pageCount.ts
 * Determines page count from the uploaded file itself — this is what
 * lib/pricing/calculate.ts trusts, never a client-supplied number.
 *
 * PDF: exact, via pdf-parse.
 * Images (PNG/JPG): always 1.
 * PPTX: exact — counts slideN.xml entries inside the .pptx zip.
 * DOCX: ESTIMATE ONLY — word count / 500 words-per-page heuristic, rounded
 *   up. Docx page count genuinely depends on rendering (fonts, margins),
 *   there's no exact answer without an actual layout engine. Flag this to
 *   shop owners in the UI ("estimated pages — final count confirmed by
 *   shop") if precision matters for your pricing model.
 */

import pdfParse from "pdf-parse";
import AdmZip from "adm-zip";
import mammoth from "mammoth";

export interface PageCountResult {
  pageCount: number;
  isEstimate: boolean;
}

const WORDS_PER_PAGE_ESTIMATE = 500;

export async function extractPageCount(
  buffer: Buffer,
  mimeType: string
): Promise<PageCountResult> {
  if (mimeType === "application/pdf") {
    const result = await pdfParse(buffer);
    return { pageCount: result.numpages, isEstimate: false };
  }

  if (mimeType.startsWith("image/")) {
    return { pageCount: 1, isEstimate: false };
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    const zip = new AdmZip(buffer);
    const slideEntries = zip
      .getEntries()
      .filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName));
    return { pageCount: Math.max(slideEntries.length, 1), isEstimate: false };
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const { value: text } = await mammoth.extractRawText({ buffer });
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const estimatedPages = Math.max(
      Math.ceil(wordCount / WORDS_PER_PAGE_ESTIMATE),
      1
    );
    return { pageCount: estimatedPages, isEstimate: true };
  }

  throw new Error(`Unsupported file type for page counting: ${mimeType}`);
}

export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB, adjust as needed
