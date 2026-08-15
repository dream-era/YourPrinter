/**
 * src/print.js
 * Sends a downloaded file to the local printer with NO dialog — this is
 * the entire point of the agent. Windows uses pdf-to-printer (wraps
 * SumatraPDF); Mac/Linux use the `lp` command via child_process, which is
 * present on virtually every Mac/Linux install by default (CUPS).
 *
 * Best-effort options mapping: copies is honored everywhere. Duplex/color
 * support depends on the printer driver and OS — this passes what it can,
 * but don't assume every combination works on every printer without
 * testing against your actual shop hardware. Binding/lamination are
 * physical finishing steps a human still does after the pages come out —
 * there's no software equivalent to automate.
 */

const os = require("os");
const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);

/**
 * @param {string} filePath - local path to the downloaded file
 * @param {object} printOptions - the order's print_options (color, sides, copies, ...)
 * @param {string|undefined} printerName - specific printer, or undefined for system default
 */
async function printFile(filePath, printOptions, printerName) {
  const platform = os.platform();
  const copies = Math.max(1, printOptions.copies ?? 1);

  if (platform === "win32") {
    return printWindows(filePath, printOptions, printerName, copies);
  }
  return printUnix(filePath, printOptions, printerName, copies);
}

async function printWindows(filePath, printOptions, printerName, copies) {
  // pdf-to-printer only handles PDFs directly. Non-PDF files (docx/pptx/
  // images) would need a conversion step (e.g. LibreOffice headless) before
  // this call — flagged clearly in the README rather than silently
  // mis-printing. For v1, route non-PDF jobs to a "convert first" TODO.
  const pdfToPrinter = require("pdf-to-printer");

  const settings = [];
  if (printOptions.sides === "double") settings.push("duplex");
  // pdf-to-printer's print-settings string is Sumatra-specific; consult
  // its docs if you need color-forcing flags for your printer model.

  await pdfToPrinter.print(filePath, {
    printer: printerName || undefined,
    copies,
    ...(settings.length ? { printDialog: false } : {}),
  });
}

async function printUnix(filePath, printOptions, printerName, copies) {
  const args = ["-n", String(copies)];
  if (printerName) args.push("-d", printerName);
  if (printOptions.sides === "double") {
    args.push("-o", "sides=two-sided-long-edge");
  }
  if (printOptions.color === "bw") {
    args.push("-o", "print-color-mode=monochrome");
  }
  args.push(filePath);

  await execFileAsync("lp", args);
}

module.exports = { printFile };
