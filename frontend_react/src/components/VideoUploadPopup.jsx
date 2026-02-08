import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaCloudUploadAlt, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { useLanguage } from '../lang/LanguageContext';
import { generateDs } from '../utils/auth';
import { TagTypeEnum } from './TagClip';
import { API_URL, VALID_VIDEO_EXTENSIONS } from '../config';

const VideoUploadPopup = ({ onClose }) => {
  const { locale, language } = useLanguage();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  
  // Form Fields
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [author, setAuthor] = useState('');
  
  // Tags State
  const [fullTagList, setFullTagList] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTags, setNewTags] = useState([]);
  
  // New Tag Input State
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagZh, setNewTagZh] = useState('');
  const [newTagEn, setNewTagEn] = useState('');
  const [newTagType, setNewTagType] = useState(Object.keys(TagTypeEnum)[0]);
  
  // Use useRef for XHR to ensure immediate access without re-renders
  const xhrRef = useRef(null);
  const mountedRef = useRef(true);
  const activeFileIdRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/video/tags');
        const json = await res.json();
        if (mountedRef.current && json.retcode === 1 && Array.isArray(json.data)) {
          setFullTagList(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    fetchTags();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (xhrRef.current) {
        console.log('Unmounting: Aborting active upload');
        xhrRef.current.abort();
      }
    };
  }, []);

  const handleClose = () => {
    if (xhrRef.current) {
      console.log('User Cancelled: Aborting upload');
      xhrRef.current.abort();
      xhrRef.current = null;

      // Trigger backend cleanup
      if (activeFileIdRef.current) {
        const userId = localStorage.getItem('user_id');
        const ds = generateDs(userId);
        const fid = activeFileIdRef.current;
        const cancelUrl = (API_URL || '/api/upload') + '/cancel';

        fetch(`${cancelUrl}?user_id=${userId}&ds=${encodeURIComponent(ds)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: fid, token16: fid }),
          keepalive: true // Ensure request survives page unload if needed
        }).catch(err => console.error('Cleanup request failed', err));
      }
    }
    onClose();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleAddNewTag = () => {
    if (!newTagZh || !newTagType) return;
    
    const newTagObj = {
      tag_zh_name: newTagZh,
      tag_en_name: newTagEn || newTagZh,
      tag_type: newTagType,
      temp_id: Date.now() // Temporary ID for UI
    };
    
    setNewTags([...newTags, newTagObj]);
    setNewTagZh('');
    setNewTagEn('');
    setIsAddingTag(false);
  };

  const removeNewTag = (tempId) => {
    setNewTags(prev => prev.filter(t => t.temp_id !== tempId));
  };

  const handleUpload = async () => {
    if (!file || !title) return;
    setUploading(true);
    setProgress(0);
    setSpeed(0);

    const userId = localStorage.getItem('user_id');
    const ds = generateDs(userId);

    if (!ds) {
      alert('Authentication error. Please login again.');
      setUploading(false);
      return;
    }

    const videoInfo = {
      group_title: title,
      group_desc: desc,
      group_author: author,
      selectedTags: selectedTags,
      newTags: newTags.map(({ temp_id, ...rest }) => rest) // Remove temp_id
    };

    const CHUNK_SIZE = 85 * 1024 * 1024; // 85MB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // Generate 16-char random token for fileId
    const array = new Uint8Array(8);
    window.crypto.getRandomValues(array);
    const fileId = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    activeFileIdRef.current = fileId;
    const uploadUrl = API_URL || '/api/upload';
    
    // Cancel any existing request
    if (xhrRef.current) {
      xhrRef.current.abort();
    }

    const startTime = Date.now();

    try {
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);
            
            const formData = new FormData();
            formData.append('token16', fileId);
            formData.append('file', chunk, file.name);
            formData.append('chunkIndex', i);
            formData.append('totalChunks', totalChunks);
            formData.append('fileId', fileId);
            formData.append('fileName', file.name);
            formData.append('videoInfo', JSON.stringify(videoInfo)); 

            let attempts = 0;
            let success = false;

            while (!success && attempts < 3) {
                 if (!mountedRef.current) return;

                 try {
                     await new Promise((resolve, reject) => {
                         const xhr = new XMLHttpRequest();
                         xhrRef.current = xhr;
                         
                         // Pass token16 (fileId) in query params for Multer to access immediately
                         xhr.open('POST', `${uploadUrl}?user_id=${userId}&ds=${encodeURIComponent(ds)}&token16=${fileId}`);
                         
                         xhr.upload.onprogress = (event) => {
                            if (event.lengthComputable && mountedRef.current) {
                                 const currentChunkLoaded = event.loaded;
                                 const totalLoadedSoFar = (i * CHUNK_SIZE) + currentChunkLoaded;
                                 const percentComplete = Math.min((totalLoadedSoFar / file.size) * 100, 100);
                                 setProgress(Math.floor(percentComplete));

                                 const timeElapsed = (Date.now() - startTime) / 1000;
                                 if (timeElapsed > 0) {
                                     const mbps = (totalLoadedSoFar / (1024 * 1024)) / timeElapsed;
                                     setSpeed(mbps.toFixed(2));
                                 }
                            }
                         };

                         xhr.onload = () => {
                             if (xhr.status === 200) {
                                 try {
                                     const response = JSON.parse(xhr.responseText);
                                     if (response.retcode === 1) {
                                         resolve(response);
                                     } else if (response.retcode === -1001) {
                                         reject(new Error('SessionExpired'));
                                     } else {
                                         reject(new Error(response.message || 'Upload failed'));
                                     }
                                 } catch (e) {
                                     reject(e);
                                 }
                             } else {
                                 reject(new Error(`Server error ${xhr.status}`));
                             }
                         };

                         xhr.onerror = () => reject(new Error('Network error'));
                         xhr.onabort = () => reject(new Error('Aborted'));

                         xhr.send(formData);
                     });
                     success = true;
                 } catch (error) {
                     if (error.message === 'Aborted') {
                         throw error;
                     }
                     if (error.message === 'SessionExpired') {
                         throw error;
                     }
                     
                     attempts++;
                     console.warn(`Chunk ${i} attempt ${attempts} failed:`, error);
                     
                     if (attempts >= 3) {
                         throw new Error(`Failed to upload chunk ${i} after 3 attempts: ${error.message}`);
                     }
                     // Retry delay
                     await new Promise(r => setTimeout(r, 1000 * attempts));
                 }
            }
        }

        if (mountedRef.current) {
            alert(locale('upload.complete'));
            onClose();
        }

    } catch (error) {
        if (error.message === 'Aborted') {
            console.log('Upload aborted by user');
        } else if (error.message === 'SessionExpired') {
            alert('Session expired. Please login again.');
            localStorage.clear();
            window.location.reload();
        } else {
            console.error(error);
            if (mountedRef.current) {
                alert('Upload failed: ' + error.message);
            }
        }
    } finally {
        if (mountedRef.current) {
            setUploading(false);
        }
        xhrRef.current = null;
        activeFileIdRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={handleClose}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.5);
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.8);
        }
      `}</style>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-700 shrink-0">
          <h2 className="text-xl font-bold text-white">{locale('upload.title')}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors"><FaTimes size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar pr-2 mr-1">
          <div className="space-y-5 pr-3">
            {/* Basic Info */}
            <div>
              <label className="block text-gray-400 text-sm mb-1.5 font-medium">{locale('upload.field_title')}</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder={locale('upload.placeholder_title')} />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5 font-medium">{locale('upload.field_desc')}</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none transition-all" placeholder={locale('upload.placeholder_desc')} />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5 font-medium">{locale('upload.field_author')}</label>
              <input type="text" value={author} onChange={e => setAuthor(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder={locale('upload.placeholder_author')} />
            </div>

            {/* Tag Selection */}
            <div>
              <label className="block text-gray-400 text-sm mb-3 font-medium">{locale('upload.field_tags')}</label>
              
              <div className="space-y-4 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                {Object.keys(TagTypeEnum).map((tagType) => (
                  <div key={tagType}>
                    <h4 className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">{locale(TagTypeEnum[tagType].localeKey)}</h4>
                    <div className="flex flex-wrap gap-2">
                      {fullTagList.filter(tagItem => tagItem.tag_type === tagType).map(tag => {
                        const isSelected = selectedTags.includes(tag.tag_id);
                        return (
                          <button 
                            key={tag.tag_id} 
                            onClick={() => toggleTag(tag.tag_id)}
                            className={`px-3 py-1 rounded-md text-xs transition-colors border ${
                              isSelected 
                              ? 'bg-blue-600 text-white border-blue-500' 
                              : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                            }`}
                          >
                            {language === 'zh' ? tag.tag_zh_name : tag.tag_en_name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* New Tags Display */}
                {newTags.length > 0 && (
                  <div>
                    <h4 className="text-xs text-blue-400 mb-2 font-medium uppercase tracking-wider">New Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {newTags.map(tag => (
                        <div key={tag.temp_id} className="flex items-center bg-blue-900/30 border border-blue-500/50 text-blue-200 px-3 py-1 rounded-md text-xs">
                          <span>{tag.tag_zh_name} ({tag.tag_type})</span>
                          <button onClick={() => removeNewTag(tag.temp_id)} className="ml-2 hover:text-white"><FaTimes /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Tag UI */}
                {!isAddingTag ? (
                  <button 
                    onClick={() => setIsAddingTag(true)}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mt-2"
                  >
                    <FaPlus /> Add Custom Tag
                  </button>
                ) : (
                  <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-600 flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[100px]">
                      <label className="text-[10px] text-gray-400 block mb-1">ZH Name</label>
                      <input type="text" value={newTagZh} onChange={e => setNewTagZh(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded px-2 py-1 text-xs" placeholder="標籤名稱" />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <label className="text-[10px] text-gray-400 block mb-1">EN Name (Opt)</label>
                      <input type="text" value={newTagEn} onChange={e => setNewTagEn(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded px-2 py-1 text-xs" placeholder="Tag Name" />
                    </div>
                    <div className="w-[100px]">
                      <label className="text-[10px] text-gray-400 block mb-1">Type</label>
                      <select value={newTagType} onChange={e => setNewTagType(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded px-2 py-1 text-xs">
                        {Object.keys(TagTypeEnum).map(type => (
                          <option key={type} value={type}>{locale(TagTypeEnum[type].localeKey)}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={handleAddNewTag} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs h-[26px]">Add</button>
                    <button onClick={() => setIsAddingTag(false)} className="text-gray-400 hover:text-white px-2 py-1 text-xs h-[26px]">Cancel</button>
                  </div>
                )}
              </div>
            </div>

            {/* File Drop Zone */}
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
              <input type="file" id="fileInput" className="hidden" onChange={e => setFile(e.target.files[0])} accept={`.zip,${VALID_VIDEO_EXTENSIONS}`} />
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-400">{speed} MB/s</p>
                  <p className="text-xs text-gray-400">{progress}%</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end gap-3 shrink-0">
          <button onClick={handleClose} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm font-medium">{locale('common.cancel')}</button>
          <button 
            onClick={handleUpload} 
            disabled={!file || !title || uploading}
            className={`px-6 py-2 rounded-lg text-white font-medium text-sm transition-all shadow-lg ${
              !file || !title || uploading 
              ? 'bg-gray-600 cursor-not-allowed opacity-50' 
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
            }`}
          >
            {uploading ? locale('upload.uploading') : locale('common.confirm')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoUploadPopup;
