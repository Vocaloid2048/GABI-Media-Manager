import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCloudUploadAlt, FaTimes, FaDownload, FaFileAlt } from 'react-icons/fa';

const ToolPopup = ({ onClose, title }) => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setSuccess(false);
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
        setError('');
        setSuccess(false);
    }
  };
  
  const handleProcess = async () => {
    if (!file) return;

    if (file.size > 3 * 1024 * 1024 * 1024) { // 3GB limit
        setError('檔案過大，上限為 3GB');
        return;
    }

    setProcessing(true);
    setError('');
    
    // Chunk configuration
    const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB per chunk
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Unique ID for this upload session

    try {
      for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(file.size, start + CHUNK_SIZE);
          const chunk = file.slice(start, end);

          const formData = new FormData();
          formData.append('file', chunk);
          formData.append('chunkIndex', i);
          formData.append('totalChunks', totalChunks);
          formData.append('fileId', fileId);
          formData.append('fileName', file.name); // Send original filename explicitly

          // For the LAST chunk, we expect the file download (blob)
          // For others, we expect JSON success
          
          if (i < totalChunks - 1) {
              // Intermediate chunks
              const res = await fetch('/api/tool/fix-encoding', {
                  method: 'POST',
                  body: formData
              });
              
              if (!res.ok) {
                  throw new Error(`Upload failed at chunk ${i + 1}`);
              } else {
                  // Optional: check response json
                  const json = await res.json();
                  if (json.retcode !== 1) throw new Error(json.msg || 'Chunk upload error');
              }
              
          } else {
              // Final chunk
              const res = await fetch('/api/tool/fix-encoding', {
                  method: 'POST',
                  body: formData
              });

              if (res.ok) {
                // Determine valid content type. If application/json, it might be an error even with 200 (though retcode usually handles that, but download sets content-type)
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    // It might be an error disguised as 200/Success with json body?
                    // But our backend sends download stream on success. 
                    // Let's try checking if it's json first?
                    // Actually, if backend calls `res.download`, content-type is determined by file (zip or probundle).
                    // If backend calls `returnSuccess` or `raiseError`, it is json.
                    
                    // Clone response to check json?
                    // Or just try processing as blob.
                    // If error, the backend usually sets 200 with {retcode: -1}.
                    // But `res.download` sets 200.
                }

                // Handle file download
                const blob = await res.blob();
                
                // If the blob is actually JSON error (unlikely with res.download unless error happened before stream start)
                if (blob.type === 'application/json') {
                     const text = await blob.text();
                     const json = JSON.parse(text);
                     if (json.retcode !== 1) {
                         throw new Error(json.msg || 'Processing failed');
                     }
                }

                // Extract filename from header or default
                const contentDisposition = res.headers.get('Content-Disposition');
                let filename = 'fixed_file.zip'; // Default
                if (contentDisposition) {
                  const match = contentDisposition.match(/filename="?([^" ;]+)"?/); // Improved regex
                  // Browsers sometimes encode filename in UTF-8
                  if (match && match[1]) {
                    try {
                        filename = decodeURIComponent(match[1]);
                    } catch(e) {
                         filename = match[1];
                    }
                  }
                } else {
                     // Fallback logic if header is missing
                     const ext = file.name.split('.').pop();
                     const base = file.name.substring(0, file.name.lastIndexOf('.'));
                     filename = `${base}_fix.${ext}`;
                }
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                setSuccess(true);
                setFile(null); // Clear file after success
              } else {
                // If not OK (e.g. 500, 413)
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.msg || 'Processing failed');
                } catch(e) {
                    throw new Error(`Server error: ${res.status}`);
                }
              }
          }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Network error or server unavailable');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-700"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FaFileAlt className="text-blue-500" />
            {title || 'ProPresenter Mac Fixer'}
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
            上傳在 Mac 製作的 .pro 或 .probundle 檔案，修復在 Windows 上顯示亂碼的問題。
          </p>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${file ? 'border-green-500/50 bg-green-500/5' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'}
              ${processing ? 'pointer-events-none opacity-50' : ''}
            `}
            onClick={() => document.getElementById('fileInput').click()}
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
                <FaFileAlt className="text-4xl mx-auto mb-2" />
                <p className="font-medium break-all">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="text-gray-400">
                <FaCloudUploadAlt className="text-4xl mx-auto mb-2" />
                <p className="font-medium">點擊上傳或拖放檔案</p>
                <p className="text-xs mt-1">支援 .pro, .probundle, .proplaylist</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
              修復完成！檔案已開始下載。
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
             <button
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleProcess}
              disabled={!file || processing}
              className={`
                px-4 py-2 rounded-lg font-medium flex items-center gap-2
                bg-blue-600 hover:bg-blue-500 text-white
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors
              `}
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  處理中...
                </>
              ) : (
                <>
                  <FaDownload />
                  修復並下載
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
