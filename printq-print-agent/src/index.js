/**
 * src/index.js
 * Entry point. Polls YourPrinter for queued print jobs at this shop, claims one
 * at a time, downloads the document via a signed URL, prints it silently,
 * and reports success/failure. Run this as a background service (see
 * README.md) so it survives reboots and doesn't need a logged-in terminal.
 */

require("dotenv").config();
const fs = require("fs");
const os = require("os");
const path = require("path");
const { printFile } = require("./print");
const { isConvertible, convertToPdf } = require("./convert");

const API_BASE_URL = process.env.API_BASE_URL;
const AGENT_KEY = process.env.AGENT_KEY;
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 8000);
const PRINTER_NAME = process.env.PRINTER_NAME || undefined;
const LIBREOFFICE_PATH = process.env.LIBREOFFICE_PATH || undefined;

if (!API_BASE_URL || !AGENT_KEY) {
  console.error(
    "Missing API_BASE_URL or AGENT_KEY. Copy .env.example to .env and fill it in."
  );
  process.exit(1);
}

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

async function apiFetch(pathname, options = {}) {
  const res = await fetch(`${API_BASE_URL}${pathname}`, {
    ...options,
    headers: {
      "X-Agent-Key": AGENT_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${options.method || "GET"} ${pathname} -> ${res.status}: ${body}`);
  }
  return res.json();
}

async function downloadToTemp(documentId, filename) {
  const { url } = await apiFetch(`/api/agent/documents/${documentId}/download-url`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download document: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const tempPath = path.join(os.tmpdir(), `printq-${documentId}-${filename}`);
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

async function processJob(job) {
  log(`Claiming job ${job.id} (order ${job.order_id})`);
  await apiFetch(`/api/agent/print-jobs/${job.id}/ack`, { method: "POST" });

  let tempPath;
  let pdfPath;
  try {
    tempPath = await downloadToTemp(job.document_id, job.document.original_filename);

    if (job.document.mime_type === "application/pdf") {
      pdfPath = tempPath;
    } else if (job.document.mime_type.startsWith("image/") && os.platform() !== "win32") {
      // CUPS (lp) prints common image formats directly on Mac/Linux — no
      // conversion needed, and it's faster than round-tripping through
      // LibreOffice for something this simple.
      pdfPath = tempPath;
    } else if (isConvertible(job.document.mime_type)) {
      // DOCX/PPTX everywhere, and images on Windows specifically (Windows
      // has no native "print this image silently" path the way CUPS does,
      // so LibreOffice's image->PDF conversion covers that gap too).
      log(`Converting ${job.document.mime_type} to PDF for job ${job.id}...`);
      pdfPath = await convertToPdf(tempPath, LIBREOFFICE_PATH);
    } else {
      throw new Error(
        `Unsupported file type for auto-print on this platform: ${job.document.mime_type}. This one needs to be printed manually.`
      );
    }

    log(`Printing job ${job.id}...`);
    await printFile(pdfPath, job.order.print_options, PRINTER_NAME);

    log(`Job ${job.id} sent to printer successfully.`);
    await apiFetch(`/api/agent/print-jobs/${job.id}/complete`, {
      method: "POST",
      body: JSON.stringify({ success: true }),
    });
  } catch (err) {
    log(`Job ${job.id} failed:`, err.message);
    await apiFetch(`/api/agent/print-jobs/${job.id}/complete`, {
      method: "POST",
      body: JSON.stringify({ success: false, error: err.message }),
    }).catch((reportErr) => {
      // If even reporting the failure fails, log loudly — this job will
      // stay stuck as 'printing' until someone investigates.
      log("ALSO failed to report the failure back to PrintQ:", reportErr.message);
    });
  } finally {
    for (const p of new Set([tempPath, pdfPath].filter(Boolean))) {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  }
}

async function pollOnce() {
  try {
    const { jobs } = await apiFetch("/api/agent/print-jobs/pending");
    if (jobs.length === 0) return;

    log(`${jobs.length} job(s) pending.`);
    // Process sequentially, not in parallel — printers handle one job at a
    // time anyway, and this keeps the "claim -> print -> report" sequence
    // simple to reason about if something goes wrong mid-batch.
    for (const job of jobs) {
      await processJob(job);
    }
  } catch (err) {
    log("Poll cycle failed:", err.message);
  }
}

async function main() {
  log(`YourPrinter print agent starting. Polling every ${POLL_INTERVAL_MS}ms.`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await pollOnce();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main();
