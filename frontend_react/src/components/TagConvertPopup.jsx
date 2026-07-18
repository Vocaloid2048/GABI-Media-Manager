import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCloudUploadAlt,
  FaTimes,
  FaDownload,
  FaLanguage,
} from "react-icons/fa";
import { generateDs } from "../utils/auth";
import { useLanguage } from "../lang/LanguageContext";
import { GROUP_LABEL_LIST } from "../constants/lyrics";

const TagConvertPopup = ({ onClose, title }) => {
  const { locale } = useLanguage();
  const [file, setFile] = useState(null);
  const [targetLang, setTargetLang] = useState("en"); // 預設英文
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [speed, setSpeed] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const xhrRef = useRef(null);
  const activeFileIdRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 獲取標籤例子
  const getLabelExamples = (lang) => {
    const examples = ['VERSE1', 'CHORUS', 'BRIDGE', 'INTRO'];
    return examples.map(key => {
      const labelObj = GROUP_LABEL_LIST[key];
      return labelObj ? { label: labelObj[lang] || labelObj.en, color: labelObj.colorHex } : { label: key, color: '#666666' };
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      setSuccess(false);
      setProgress(0);
      setStatusMessage("");
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    const userId = localStorage.getItem("user_id");
    const ds = generateDs(userId);

    if (!ds) {
      setError("Authentication error. Please login again.");
      return;
    }

    setProcessing(true);
    setProgress(0);
    setError("");
    setStatusMessage(locale('tool.preparing'));

    const startTime = Date.now();
    const fileId = "tool_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    activeFileIdRef.current = fileId;

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    try {
      for (let i = 0; i < totalChunks; i++) {
        if (!mountedRef.current) break;

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("file", chunk);
        formData.append("chunkIndex", i);
        formData.append("totalChunks", totalChunks);
        formData.append("fileId", fileId);
        formData.append("fileName", file.name);
        formData.append("targetLang", targetLang); // 新增目標語言

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;
          
          if (i === totalChunks - 1) {
             xhr.responseType = "blob";
             xhr.onloadstart = () => {
                if (xhr.upload.loaded === xhr.upload.total) {
                  setStatusMessage(locale('tool.processing'));
                }
             };
          }

          xhr.open(
            "POST",
            `/api/tool/tag-convert?token16=${fileId}&user_id=${userId}&ds=${encodeURIComponent(ds)}`,
          );

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && mountedRef.current) {
              const currentChunkLoaded = event.loaded;
              const totalLoadedSoFar = i * CHUNK_SIZE + currentChunkLoaded;
              const percentComplete = Math.min((totalLoadedSoFar / file.size) * 100, 100);
              setProgress(Math.floor(percentComplete));

              const timeElapsed = (Date.now() - startTime) / 1000;
              if (timeElapsed > 0) {
                const mbps = totalLoadedSoFar / (1024 * 1024) / timeElapsed;
                setSpeed(mbps.toFixed(2));
              }
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
               if (i === totalChunks - 1) {
                  // Final chunk handling
                  const blob = xhr.response;
                  if (blob.type === "application/json") {
                    const reader = new FileReader();
                    reader.onload = () => {
                       try {
                         const json = JSON.parse(reader.result);
                         reject(new Error(json.msg || "Server error"));
                       } catch(e) { reject(new Error("Unknown server error")); }
                    };
                    reader.readAsText(blob);
                  } else {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${file.name.split('.').slice(0, -1).join('.')}_tag_${targetLang}${file.name.substring(file.name.lastIndexOf('.'))}`;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                       document.body.removeChild(a);
                       window.URL.revokeObjectURL(url);
                    }, 100);
                    resolve({ retcode: 1 });
                  }
               } else {
                  try {
                    const res = JSON.parse(xhr.responseText);
                    if (res.retcode === 1 || res.retcode === "1") resolve(res);
                    else reject(new Error(res.msg || "Chunk upload error"));
                  } catch(e) { reject(e); }
               }
            } else {
              reject(new Error(`Server error ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.onabort = () => reject(new Error("Aborted"));
          xhr.send(formData);
        });
      }

      setProcessing(false);
      setSuccess(true);
      setStatusMessage(locale('tool.completed'));
    } catch (e) {
      if (mountedRef.current) {
        setError(e.message);
        setProcessing(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden bg-gray-800 border border-gray-700 shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaLanguage className="text-blue-500" />
            {title}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) setFile(droppedFile);
              }}
              className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group cursor-pointer"
              onClick={() => document.getElementById("tool-file-input").click()}
            >
              <FaCloudUploadAlt className="text-5xl text-gray-600 group-hover:text-blue-500 transition-colors mb-4" />
              <p className="text-gray-300 font-medium mb-1">{locale('tool.drag_drop')}</p>
              <p className="text-gray-500 text-sm">{locale('tool.supports')}</p>
              <input id="tool-file-input" type="file" className="hidden" onChange={handleFileChange} />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <FaCloudUploadAlt className="text-2xl text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-gray-400 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                {!processing && !success && (
                  <button onClick={() => setFile(null)} className="text-gray-500 hover:text-red-400 p-2">
                    <FaTimes />
                  </button>
                )}
              </div>

              {!processing && !success && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <FaLanguage /> {locale('tool.tag_convert_lang')}
                  </label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English (e.g. Chorus 1)</option>
                    <option value="zh_hk">繁體中文 (例如: 副歌 1)</option>
                    <option value="zh_cn">简体中文 (例如: 副歌 1)</option>
                  </select>
                  {/* 標籤例子預覽 */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getLabelExamples(targetLang).map((example, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white border"
                        style={{ backgroundColor: example.color, borderColor: example.color }}
                      >
                        {example.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(processing || success) && (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{statusMessage}</span>
                    <span className="text-blue-500 font-bold">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{speed ? `${speed} MB/s` : "--- MB/s"}</span>
                    <span>{locale('tool.processing_status')}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm text-center">
                  {locale('tool.completed')}
                </div>
              )}

              {!processing && !success && (
                <button
                  onClick={handleProcess}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                >
                  {locale('tool.repair_download')}
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TagConvertPopup;