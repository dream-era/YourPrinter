/**
 * src/convert.js
 * Converts DOCX/PPTX to PDF via LibreOffice headless before printing —
 * closes the "PDF only" gap from v1. Requires LibreOffice installed on the
 * shop PC (a one-time setup step, see README).
 *
 * This shells out to `soffice --headless --convert-to pdf` — LibreOffice's
 * headless mode is the standard, well-tested way to do server-side
 * document conversion; there's no good pure-JS equivalent that handles
 * real-world DOCX/PPTX formatting faithfully.
 */

const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);

const CONVERTIBLE_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "image/png",
  "image/jpeg",
];

function isConvertible(mimeType) {
  return CONVERTIBLE_MIME_TYPES.includes(mimeType);
}

/**
 * @param {string} inputPath - path to the .docx/.pptx file
 * @param {string} sofficePath - path to the soffice/libreoffice binary
 * @returns {Promise<string>} path to the converted PDF
 */
async function convertToPdf(inputPath, sofficePath) {
  const outputDir = path.dirname(inputPath);
  const binary = sofficePath || "soffice";

  try {
    await execFileAsync(binary, [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      outputDir,
      inputPath,
    ]);
  } catch (err) {
    throw new Error(
      `LibreOffice conversion failed. Is LibreOffice installed and is LIBREOFFICE_PATH set correctly? Original error: ${err.message}`
    );
  }

  const expectedOutput = inputPath.replace(/\.(docx|pptx|png|jpe?g)$/i, ".pdf");
  if (!fs.existsSync(expectedOutput)) {
    throw new Error(
      `LibreOffice reported success but no PDF was found at ${expectedOutput}`
    );
  }

  return expectedOutput;
}

module.exports = { isConvertible, convertToPdf };
