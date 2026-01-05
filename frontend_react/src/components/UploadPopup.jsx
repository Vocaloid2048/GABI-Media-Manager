import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';
import { useLanguage } from '../lang/LanguageContext';

const UploadPopup = ({ onClose }) => {
  const { locale } = useLanguage();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    // Mock upload simulation
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 10;
      if (p > 100) p = 100;
      setProgress(Math.floor(p));
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setUploading(false);
          alert(locale('upload.complete'));
          onClose();
        }, 500);
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{locale('upload.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><FaTimes size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-5">
            <div>
              <label className="block text-gray-400 text-sm mb-1.5 font-medium">{locale('upload.field_title')}</label>
              <input type="text" className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder={locale('upload.placeholder_title')} />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5 font-medium">{locale('upload.field_desc')}</label>
              <textarea className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none transition-all" placeholder={locale('upload.placeholder_desc')} />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5 font-medium">{locale('upload.field_tags')}</label>
              <input type="text" className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder={locale('upload.placeholder_tags')} />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5 font-medium">{locale('upload.field_author')}</label>
              <input type="text" className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder={locale('upload.placeholder_author')} />
            </div>

            <div 
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${file ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 bg-gray-900/50 hover:bg-gray-900 hover:border-gray-500'}`}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <FaCloudUploadAlt className={`text-4xl mb-3 ${file ? 'text-blue-400' : 'text-gray-500'}`} />
              <p className="text-gray-300 text-sm text-center font-medium">
                {file ? file.name : locale('upload.drag_drop')}
              </p>
              <p className="text-gray-500 text-xs mt-1">{locale('upload.supports')}</p>
              <input type="file" id="fileInput" className="hidden" onChange={e => setFile(e.target.files[0])} accept=".zip,.mp4,.avi" />
            </div>

            {uploading && (
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>{locale('upload.uploading')}</span>
                  <span className="font-mono">{progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span>{locale('upload.speed')} 4.2 MB/s</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end gap-3 bg-gray-800 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors font-medium">Cancel</button>
          <button onClick={handleUpload} disabled={!file || uploading} className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20">
            {uploading ? 'Processing...' : 'Confirm Upload'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UploadPopup;
