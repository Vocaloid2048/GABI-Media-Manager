import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCloudUploadAlt,
  FaTimes,
  FaDownload,
  FaWrench,
} from "react-icons/fa";
import { generateDs } from "../utils/auth";
import { useLanguage } from "../lang/LanguageContext";

const ToolPopup = ({ onClose, title }) => {
  const { locale } = useLanguage();
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [speed, setSpeed] = useState(null); // MB/s string
  const [statusMessage, setStatusMessage] = useState(""); // e.g. "Checking...", "Uploading..."

  const xhrRef = useRef(null);
  const activeFileIdRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      setSuccess(false);
      setProgress(0);
      setSpeed(null);
      setStatusMessage("");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError("");
      setSuccess(false);
      setProgress(0);
      setSpeed(null);
      setStatusMessage("");
    }
  };

  const handleCancel = async () => {
    // 1. Abort current XHR
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    // 2. Send cancel request to backend if we have a fileId
    if (activeFileIdRef.current) {
      try {
        const userId = localStorage.getItem("user_id");
        const ds = generateDs(userId);

        await fetch(
          `/api/tool/cancel?user_id=${userId}&ds=${encodeURIComponent(ds)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId: activeFileIdRef.current }),
          },
        );
      } catch (e) {
        console.warn("Cancel request failed", e);
      }
    }

    setProcessing(false);
    setProgress(0);
    setSpeed(null);
    setStatusMessage(locale('tool.cancelled'));
  };

  const handleProcess = async () => {
    if (!file) return;

    const userId = localStorage.getItem("user_id");
    const ds = generateDs(userId);

    if (!ds) {
      setError("Authentication error. Please login again.");
      return;
    }

    if (file.size > 3 * 1024 * 1024 * 1024) {
      // 3GB limit
      setError(locale('tool.file_too_large').replace('%1', '3GB'));
      return;
    }

    setProcessing(true);
    setError("");
    setProgress(0);
    setStatusMessage(locale('tool.preparing'));

    // Chunk configuration
    const CHUNK_SIZE = 85 * 1024 * 1024; // 85MB per chunk (same as video upload)
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Unique ID
    activeFileIdRef.current = fileId;

    let startTime = Date.now();
    let uploadedBytes = 0;

    try {
      for (let i = 0; i < totalChunks; i++) {
        if (!mountedRef.current) return;

        const start = i * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("file", chunk);
        formData.append("chunkIndex", i);
        formData.append("totalChunks", totalChunks);
        formData.append("fileId", fileId);
        formData.append("token16", fileId); // For consistency
        formData.append("fileName", file.name);

        // Update Status
        setStatusMessage(`上傳中...`);

        // Retry logic
        let attempts = 0;
        let success = false;

        while (!success && attempts < 3) {
          try {
            // For the LAST chunk, we expect the file download (blob)
            // BUT user wants processing separated if possible, or at least handled logically.
            // Current backend: Validates all chunks on every call, if all present -> merges -> responds.
            // So the LAST chunk call IS the processing call.

            // For intermediate chunks
            if (i < totalChunks - 1) {
              await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhrRef.current = xhr;
                // Use query param and userId/ds
                xhr.open(
                  "POST",
                  `/api/tool/fix-encoding?token16=${fileId}&user_id=${userId}&ds=${encodeURIComponent(ds)}`,
                );

                xhr.upload.onprogress = (event) => {
                  if (event.lengthComputable && mountedRef.current) {
                    const currentChunkLoaded = event.loaded;
                    const totalLoadedSoFar =
                      i * CHUNK_SIZE + currentChunkLoaded;
                    const percentComplete = Math.min(
                      (totalLoadedSoFar / file.size) * 100,
                      100,
                    );
                    setProgress(Math.floor(percentComplete));

                    const timeElapsed = (Date.now() - startTime) / 1000;
                    if (timeElapsed > 0) {
                      const mbps =
                        totalLoadedSoFar / (1024 * 1024) / timeElapsed;
                      setSpeed(mbps.toFixed(2));
                    }
                  }
                };

                xhr.onload = () => {
                  if (xhr.status === 200) {
                    try {
                      const response = JSON.parse(xhr.responseText);
                      if (response.retcode === 1 || response.retcode === "1") {
                        resolve(response);
                      } else {
                        reject(new Error(response.msg || "Chunk upload error"));
                      }
                    } catch (e) {
                      reject(e);
                    }
                  } else {
                    reject(new Error(`Server error ${xhr.status}`));
                  }
                };

                xhr.onerror = () => reject(new Error("Network error"));
                xhr.onabort = () => reject(new Error("Aborted"));

                xhr.send(formData);
              });
              success = true;
            } else {
              // Final chunk
              // We upload it, ensuring progress reaches 100%
              await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhrRef.current = xhr;
                xhr.open(
                  "POST",
                  `/api/tool/fix-encoding?token16=${fileId}&user_id=${userId}&ds=${encodeURIComponent(ds)}`,
                );

                xhr.upload.onprogress = (event) => {
                  if (event.lengthComputable && mountedRef.current) {
                    const currentChunkLoaded = event.loaded;
                    const totalLoadedSoFar =
                      i * CHUNK_SIZE + currentChunkLoaded;
                    const percentComplete = Math.min(
                      (totalLoadedSoFar / file.size) * 100,
                      100,
                    );
                    setProgress(Math.floor(percentComplete));

                    // Final chunk uploading...
                  }
                };

                // When upload finishes, we enter "processing" state
                xhr.onloadstart = () => {
                  if (xhr.upload.loaded === xhr.upload.total) {
                    setStatusMessage(locale('tool.processing'));
                  }
                };

                xhr.onload = () => {
                  if (xhr.status === 200) {
                    // Handle file download
                    const blob = xhr.response;

                    // If the blob is actually JSON error
                    if (
                      xhr
                        .getResponseHeader("content-type")
                        ?.includes("application/json")
                    ) {
                      // Reader to parse blob text
                      const reader = new FileReader();
                      reader.onload = () => {
                        try {
                          const json = JSON.parse(reader.result);
                          if (json.retcode !== 1)
                            reject(new Error(json.msg || "Processing failed"));
                          else resolve();
                        } catch (e) {
                          reject(e);
                        }
                      };
                      reader.readAsText(blob);
                    } else {
                      // Process blob download
                      const contentDisposition = xhr.getResponseHeader(
                        "Content-Disposition",
                      );
                      let filename = "fixed_file.zip";
                      if (contentDisposition) {
                        const match = contentDisposition.match(
                          /filename="?([^" ;]+)"?/,
                        );
                        if (match && match[1]) {
                          try {
                            filename = decodeURIComponent(match[1]);
                          } catch (e) {
                            filename = match[1];
                          }
                        }
                      } else {
                        const ext = file.name.split(".").pop();
                        const base = file.name.substring(
                          0,
                          file.name.lastIndexOf("."),
                        );
                        filename = `${base}_fix.${ext}`;
                      }

                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);

                      setSuccess(true);
                      setFile(null);
                      setStatusMessage(locale('tool.completed'));
                      resolve();
                    }
                  } else {
                    // Try convert blob to text for error
                    const reader = new FileReader();
                    reader.onload = () => {
                      try {
                        const json = JSON.parse(reader.result);
                        reject(
                          new Error(json.msg || `Server error: ${xhr.status}`),
                        );
                      } catch (e) {
                        reject(new Error(`Server error: ${xhr.status}`));
                      }
                    };
                    reader.readAsText(xhr.response);
                  }
                };

                xhr.onerror = () => reject(new Error("Network error"));
                xhr.onabort = () => reject(new Error("Aborted"));
                xhr.responseType = "blob";

                xhr.send(formData);
              });
              success = true;
            }
          } catch (err) {
            if (err.message === "Aborted") throw err;
            attempts++;
            console.warn(`Chunk ${i} attempt ${attempts} failed:`, err);
            if (attempts >= 3)
              throw new Error(`Failed to upload chunk ${i} after 3 attempts`);
            await new Promise((r) => setTimeout(r, 30000 * attempts));
          }
        }

        // Speed calc
        uploadedBytes += chunk.size;
      }
    } catch (err) {
      if (err.message === "Aborted") {
        console.log("Upload cancelled by user");
        // State handled in handleCancel
      } else {
        console.error(err);
        setError(err.message || "Network error or server unavailable");
        setProcessing(false);
      }
    } finally {
      if (activeFileIdRef.current === fileId && !success && error) {
        // If we finished with error, ensure processing is false
        setProcessing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-700"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FaWrench className="text-yellow-500" />
            {title || "ProPresenter Mac Fixer"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-300 mb-4 text-sm">
            {locale('tool.upload_description')}
          </p>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${file ? "border-green-500/50 bg-green-500/5" : "border-gray-600 hover:border-gray-500 hover:bg-gray-700/30"}
              ${processing ? "pointer-events-none opacity-50" : ""}
            `}
            onClick={() => document.getElementById("fileInput").click()}
          >
            <input
              type="file"
              id="fileInput"
              className="hidden"
              accept=".pro,.probundle,.proplaylist"
              onChange={handleFileChange}
            />

            {file ? (
              <div className="text-green-400">
                <FaWrench className="text-4xl mx-auto mb-2" />
                <p className="font-medium break-all">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-gray-400">
                <FaCloudUploadAlt className="text-4xl mx-auto mb-2" />
                <p className="font-medium">{locale('tool.drag_drop')}</p>
                <p className="text-xs mt-1">
                  {locale('tool.supports')}
                </p>
              </div>
            )}
          </div>

          {processing && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-300">
                <span>
                  {statusMessage}{" "}
                  {progress > 0 && progress < 100 && `(${progress}%)`}
                </span>
                {speed && progress < 100 && <span>{speed} MB/s</span>}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
              {locale('tool.repair_complete')}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            {processing && progress < 100 && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              >
                {locale('tool.cancel')}
              </button>
            )}
            <button
              onClick={success ? onClose : handleProcess}
              disabled={(!file && !success) || (processing && !success)}
              className={`
                px-4 py-2 rounded-lg font-medium flex items-center gap-2
                ${success ? "bg-green-600 hover:bg-green-500" : "bg-blue-600 hover:bg-blue-500"} text-white
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors
              `}
            >
              {success ? (
                <>{locale('tool.done')}</>
              ) : processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {locale('tool.processing_status')}
                </>
              ) : (
                <>
                  <FaDownload />
                  {locale('tool.repair_download')}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ToolPopup;
