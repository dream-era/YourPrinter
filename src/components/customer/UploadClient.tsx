"use client";

import React, { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CloudUpload, FileText, MoreHorizontal, Folder, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { validatePDFFile } from "@/features/documents/pdf-utils";

interface UploadedFile {
  id: string;
  name: string;
  pages: number;
  size: string;
  url?: string;
}

type UploadPhase =
  | "idle"
  | "analyzing"
  | "getting-url"
  | "uploading"
  | "finalizing"
  | "success"
  | "error";

/**
 * Upload a file to a pre-signed PUT URL using XMLHttpRequest so we can
 * report real byte-level progress. Returns a Promise that resolves on
 * HTTP 2xx, or rejects with an error message.
 */
function uploadWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Upload failed: HTTP ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload. Please check your connection."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was cancelled."));
    });

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(file);
  });
}

export default function UploadClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId") || "";

  const [recentFiles, setRecentFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const isUploading = uploadPhase !== "idle" && uploadPhase !== "success" && uploadPhase !== "error";

  const phaseLabel: Record<UploadPhase, string> = {
    idle: "",
    analyzing: "Analyzing document…",
    "getting-url": "Getting secure upload link…",
    uploading: `Uploading to secure cloud… ${uploadProgress}%`,
    finalizing: "Finalizing upload…",
    success: "Upload complete!",
    error: uploadError || "Upload failed",
  };

  const doUpload = async (file: File) => {
    setUploadPhase("analyzing");
    setUploadError(null);
    setUploadProgress(0);

    try {
      // ── 1. Parse page count client-side ──────────────────────────────────
      let pageCount = 1;
      if (file.type === "application/pdf") {
        const { PDFDocument } = await import("pdf-lib");
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        pageCount = pdfDoc.getPageCount();
      }

      // ── 2. Get a B2 pre-signed upload URL from the server ─────────────────
      setUploadPhase("getting-url");
      const urlRes = await fetch("/api/documents/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          shopId,
          pageCount,
        }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error || "Failed to get upload URL");

      // ── 3. Stream-upload directly to Backblaze B2 (XHR for progress) ──────
      setUploadPhase("uploading");
      await uploadWithProgress(urlData.signedUrl, file, file.type, (pct) => {
        setUploadProgress(pct);
      });

      // ── 4. Tell the server to verify + mark document ready ────────────────
      setUploadPhase("finalizing");
      const processRes = await fetch(`/api/documents/${urlData.documentId}/process`, {
        method: "POST",
      });
      const processData = await processRes.json();
      if (!processRes.ok) {
        if (processData.retryUpload) {
          throw new Error(
            "Upload could not be verified. Please try again — your file may not have reached the server."
          );
        }
        throw new Error(processData.error || "Failed to finalize upload");
      }

      // ── 5. Add to recent files list ───────────────────────────────────────
      const doc = processData.document;
      const newFile: UploadedFile = {
        id: doc.id,
        name: doc.original_filename,
        pages: doc.page_count,
        size: (doc.size_bytes / (1024 * 1024)).toFixed(1) + " MB",
      };
      setRecentFiles((prev) => [newFile, ...prev]);
      setSelectedFileId(newFile.id);
      setUploadPhase("success");
      toast.success("File uploaded successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload file";
      setUploadPhase("error");
      setUploadError(message);
      toast.error(message);
    }

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPendingFile(file);
    await doUpload(file);
  };

  const handleRetry = async () => {
    if (!pendingFile) return;
    setUploadPhase("idle");
    await doUpload(pendingFile);
  };

  const handleContinue = () => {
    if (!shopId) {
      toast.error("No shop selected.");
      return;
    }
    const selectedFile = recentFiles.find((f) => f.id === selectedFileId);
    if (!selectedFile) {
      toast.error("Please upload and select a PDF file to print.");
      return;
    }
    router.push(
      `/customer/options?shopId=${shopId}&documentId=${selectedFile.id}&file=${encodeURIComponent(selectedFile.name)}&pages=${selectedFile.pages}`
    );
  };

  return (
    <div className="min-h-screen bg-white pb-[120px] font-sans">
      {/* Header */}
      <header className="bg-white px-4 pt-6 pb-4 flex items-center shadow-sm sticky top-0 z-40 max-w-3xl mx-auto w-full">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition -ml-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 ml-2">Upload &amp; Print</h1>
      </header>

      <div className="max-w-3xl mx-auto w-full">
        {/* Stepper */}
        <div className="bg-white px-6 pb-6 pt-2 shadow-sm mb-6 flex justify-between items-center relative rounded-b-3xl">
          <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-slate-100 -z-10 -translate-y-1/2"></div>

          <div className="flex flex-col items-center gap-2 bg-white px-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center border-2 border-white shadow-sm text-sm">
              1
            </div>
            <span className="text-xs font-bold text-blue-600">Upload</span>
          </div>

          <div className="flex flex-col items-center gap-2 bg-white px-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center border-2 border-white shadow-sm text-sm">
              2
            </div>
            <span className="text-xs font-semibold text-slate-500">Options</span>
          </div>

          <div className="flex flex-col items-center gap-2 bg-white px-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center border-2 border-white shadow-sm text-sm">
              3
            </div>
            <span className="text-xs font-semibold text-slate-500">Review</span>
          </div>
        </div>

        <div className="px-5">
          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-blue-200 rounded-[24px] bg-[#F8FAFC] p-8 flex flex-col items-center justify-center mb-6 relative overflow-hidden">
            <div className="mb-4 text-blue-500">
              <CloudUpload className="w-12 h-12 stroke-[1.5]" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Upload PDF</h2>
            <p className="text-slate-500 text-sm mb-1 text-center">Drag &amp; drop or tap to select file</p>
            <p className="text-slate-400 text-xs mb-6 text-center">PDF, DOCX, PPTX, PNG, JPG · Max 50 MB</p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/png,image/jpeg"
              className="hidden"
              disabled={isUploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-blue-100 bg-white text-blue-600 font-semibold hover:border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Folder className="w-4 h-4" />
              Select File
            </button>
          </div>

          {/* Upload Progress / Status */}
          <AnimatePresence mode="wait">
            {uploadPhase !== "idle" && (
              <motion.div
                key={uploadPhase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={`mb-6 p-4 rounded-2xl border flex flex-col gap-3 ${
                  uploadPhase === "error"
                    ? "bg-red-50 border-red-200"
                    : uploadPhase === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-blue-50 border-blue-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  {uploadPhase === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  ) : uploadPhase === "error" ? (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                  )}
                  <p
                    className={`text-sm font-semibold ${
                      uploadPhase === "error"
                        ? "text-red-700"
                        : uploadPhase === "success"
                        ? "text-green-700"
                        : "text-blue-700"
                    }`}
                  >
                    {phaseLabel[uploadPhase]}
                  </p>
                </div>

                {/* Progress bar */}
                {uploadPhase === "uploading" && (
                  <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: "linear" }}
                    />
                  </div>
                )}

                {/* Retry button */}
                {uploadPhase === "error" && pendingFile && (
                  <button
                    onClick={handleRetry}
                    className="self-start flex items-center gap-2 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Upload
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Files */}
          {recentFiles.length > 0 && (
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 mb-4 ml-1">Recent Files</h2>
              <div className="space-y-3">
                {recentFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`flex items-center justify-between p-4 rounded-[16px] border transition-all cursor-pointer ${
                      selectedFileId === file.id
                        ? "border-blue-600 bg-blue-50/30 shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                        <FileText className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[14px] text-slate-900 line-clamp-1 break-all pr-2 max-w-[200px]">
                          {file.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {file.pages} pages · {file.size}
                        </p>
                      </div>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Primary Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-3xl mx-auto">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            disabled={isUploading || !selectedFileId}
            className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-[20px] shadow-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </motion.button>
        </div>
      </div>
    </div>
  );
}
