import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../lang/LanguageContext';
import { FaUser, FaHistory, FaLock, FaGlobe, FaDownload, FaCamera, FaPen, FaTimes } from 'react-icons/fa';
import { generateDs } from '../utils/auth';
import { sha256 } from 'js-sha256';
import TitleFooter from '../components/TitleFooter';

const ChangePasswordPopup = ({ onClose, userId, locale }) => {
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [msg, setMsg] = useState('');

    const handleSubmit = async () => {
        if (newPass === '' || confirmPass === '') {
            setMsg(locale('user.password.empty') || "Password fields cannot be empty");
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(newPass)) {
            setMsg(locale('login.err.password_format'));
            return;
        }

        if (newPass !== confirmPass) {
            setMsg(locale('user.password.mismatch') || "Passwords do not match");
            return;
        }
        
        const ds = generateDs(userId);
        try {
            const res = await fetch('/api/user/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ds': ds, 'user_id': userId },
                body: JSON.stringify({ 
                    new_password: sha256(newPass) 
                })
            });
            const json = await res.json();
            if (json.retcode === 1) {
                onClose();

                // Show success alert
                alert(locale('user.password.modify_success'));
            } else {
                setMsg(json.message);
            }
        } catch (err) {
            setMsg("Network Error");
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm space-y-4">
                <h3 className="text-xl font-bold">{locale('user.settings.change_password')}</h3>
                {msg && <p className="text-red-400 text-sm">{msg}</p>}
                
                <input type="password" placeholder={locale('user.password.new')} className="w-full bg-gray-700 p-3 rounded-lg outline-none" value={newPass} onChange={e => setNewPass(e.target.value)} />
                <input type="password" placeholder={locale('user.password.confirm')} className="w-full bg-gray-700 p-3 rounded-lg outline-none" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />

                <div className="flex gap-2 justify-end pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400">{locale('common.cancel')}</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 rounded-lg">{locale('common.confirm')}</button>
                </div>
            </div>
        </div>
    );
}

const EditNamePopup = ({ currentName, onClose, onSave, locale }) => {
    const [name, setName] = useState(currentName);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4">{locale('user.settings.edit_name') || "Edit Name"}</h3>
                <input
                    className="w-full bg-gray-700 text-white p-3 rounded-lg mb-4 outline-none focus:ring-2 ring-blue-500"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">{locale('common.cancel')}</button>
                    <button onClick={() => onSave(name)} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500">{locale('common.confirm')}</button>
                </div>
            </div>
        </div>
    )
}

const HistoryItem = ({ item, onDownload }) => {
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            className="cursor-pointer group relative rounded-xl overflow-hidden bg-gray-800 shadow-lg border border-gray-700 aspect-video"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate(`/group/${item.group_id}`)}
        >
            {item.video_id || item.group_id ? (
                <img
                    src={`/api/video/thumb?name=${item.video_id || item.group_id}${isHovered ? '_anim.webp' : '.webp'}`}
                    alt={item.title}
                    className="w-full h-full object-cover transition-opacity"
                    onError={(e) => { e.target.src = '/no_preview.webp'; }}
                />
            ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500">
                    <FaDownload />
                </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-8">
                <h4 className="text-white font-bold text-sm truncate shadow-black drop-shadow-md">{item.title}</h4>
                <p className="text-xs text-gray-300 flex items-center gap-1">
                    <span className="opacity-70">{item.date}</span>
                </p>
            </div>

            {/* Download Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDownload(item);
                }}
                className={`absolute bottom-2 right-2 z-10 bg-gray-900 hover:bg-gray-500 text-white p-2 rounded-full shadow-lg transition-all duration-200 opacity-100 scale-100`}
                title="Download"
            >
                <FaDownload size={12} />
            </button>
        </motion.div>
    );
};

const UserPage = () => {
    const { locale, setLanguage, language } = useLanguage();
    const [downloadHistory, setDownloadHistory] = useState([]);
    const [userInfo, setUserInfo] = useState({ localeName: '', username: '', user_id: '', icon: null });
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showPassPopup, setShowPassPopup] = useState(false);
    const [showNamePopup, setShowNamePopup] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const userId = localStorage.getItem('user_id');

        if (userId) {
            setIsLoggedIn(true);
            fetchUserInfo(userId);
            fetchHistory(userId);
        } else {
            window.location.href = '/';
        }
    }, []);

    const fetchUserInfo = async (userId) => {
        try {
            const ds = generateDs(userId);
            const res = await fetch(`/api/user/info?user_id=${userId}`, { headers: { 'ds': ds } });
            const json = await res.json();
            if (json.retcode === 1) {
                setUserInfo({
                    user_id: json.data.user_id,
                    username: json.data.username,
                    localeName: json.data.locale_name,
                    icon: json.data.icon
                });
            }
            console.log(json);
        } catch (err) { console.error(err); }
    };

    const fetchHistory = async (userId) => {
        try {
            const ds = generateDs(userId);
            if (!ds) return;

            const res = await fetch(`/api/user/history/download?user_id=${userId}`, {
                headers: {
                    'ds': ds
                }
            });
            const json = await res.json();

            if (json.retcode === 1) {
                setDownloadHistory(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        }
    };

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert(locale('user.err.avatar_format'));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert(locale('user.err.avatar_size'));
            return;
        }

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = async () => {
            const { width, height } = img;
            URL.revokeObjectURL(img.src);
            if (width < 64 || height < 64 || width > 1024 || height > 1024) {
                alert(locale('user.err.avatar_dims'));
                return;
            }

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const ds = generateDs(userInfo.user_id);
                const res = await fetch('/api/user/avatar', {
                    method: 'POST',
                    headers: { 'ds': ds, 'user_id': userInfo.user_id },
                    body: formData
                });
                const json = await res.json();
                if (json.retcode === 1) {
                    setUserInfo(prev => ({ ...prev, icon: json.data.icon }));
                } else {
                    alert(json.message);
                }
            } catch (err) { console.error(err); }
        };
    };

    const handleNameSave = async (newName) => {
        const ds = generateDs(userInfo.user_id);
        try {
            const res = await fetch('/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ds': ds, 'user_id': userInfo.user_id },
                body: JSON.stringify({ locale_name: newName })
            });
            const json = await res.json();
            if (json.retcode === 1) {
                setUserInfo(prev => ({ ...prev, localeName: json.data.locale_name }));
                setShowNamePopup(false);
            }
        } catch (err) { console.error(err); }
    }

    const handleDownload = async (itemData) => {
        const userId = localStorage.getItem('user_id');
        const ds = generateDs(userId);
    
        if (!ds) {
          alert('Authentication error. Please login again.');
          return;
        }
    
        // 1. Check Auth First
        try {
          const checkUrl = `/api/video/download?check=true&user_id=${userId}&ds=${encodeURIComponent(ds)}`;
          const res = await fetch(checkUrl);
          const json = await res.json();
    
          if (json.retcode === -1001) {
            alert('Session expired. Please login again.');
            localStorage.clear();
            window.location.reload();
            return;
          } else if (json.retcode !== 1) {
            alert('Download error: ' + (json.message || 'Unknown error'));
            return;
          }
        } catch (e) {
          console.error("Auth check failed", e);
          return;
        }
    
        // 2. Proceed to Download
        // Use video_id if available (file download), otherwise assume group download if only group_id present (though history usually records video downloads)
        // If it's a history item, it might be a specific file or a zip. 
        // Let's assume generic download endpoint handles both based on ID.
        // Actually DetailPage differentiates.
        // History items from DB usually have video_id if it was a single file. 
        // Let's rely on what we have. history API usually returns video_id for single files.
        const targetId = itemData.video_id || itemData.group_id;
        const downloadUrl = `/api/video/download?id=${targetId}&user_id=${userId}&ds=${encodeURIComponent(ds)}`;
    
        const link = document.createElement('a');
        link.href = downloadUrl;
        // Ideally we should have the original intent (zip or direct) but let's assume default behavior of the API
        link.setAttribute('download', itemData.title || 'download');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (!isLoggedIn) return <div className="p-10 text-white">Loading...</div>;

    return (
        <div className="flex-1 overflow-y-auto bg-gray-900 text-white p-4">
            <h2 className="text-2xl font-bold mb-6 px-2">{locale('user.profile')}</h2>

            <AnimatePresence>
                {showNamePopup && (
                    <EditNamePopup
                        currentName={userInfo.localeName || userInfo.username}
                        onClose={() => setShowNamePopup(false)}
                        onSave={handleNameSave}
                        locale={locale}
                    />
                )}
                {showPassPopup && (
                    <ChangePasswordPopup
                        userId={userInfo.user_id}
                        onClose={() => setShowPassPopup(false)}
                        locale={locale}
                    />
                )}
            </AnimatePresence>

            {/* Profile Card */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6 shadow-lg flex items-center gap-4">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>

                    {userInfo.icon ? (
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden border-2 border-gray-700">
                            <img src={`/api/user/avatar?id=${userInfo.user_id}&v=${userInfo.icon}`} className="w-full h-full object-cover" />
                        </div>
                        ) : (
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden border-2 border-gray-700">
                            <FaUser />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <FaCamera className="text-white text-sm" />
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{userInfo.localeName || userInfo.username}</h3>
                        <button onClick={() => setShowNamePopup(true)} className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"><FaPen className="text-xs" /></button>
                    </div>
                    <p className="text-gray-400 text-sm">@{userInfo.username}</p>
                </div>
            </div>

            {/* Settings Section */}
            <div className="space-y-4">

                {/* Language Settings */}
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-700 font-bold text-gray-400 text-sm uppercase flex items-center gap-2">
                        <FaGlobe /> {locale('user.settings.language')}
                    </div>
                    <div className="w-full p-4 flex items-center justify-between">
                        <span>{locale('user.settings.current_language')}</span>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-gray-700 text-blue-400 font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer border border-transparent focus:border-blue-500 transition-colors"
                        >
                            <option value="zh">繁體中文</option>
                            <option value="en">EN</option>
                        </select>
                    </div>
                </div>

                {/* Password / Security */}
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-700 font-bold text-gray-400 text-sm uppercase flex items-center gap-2">
                        <FaLock /> {locale('user.settings.security')}
                    </div>
                    <button
                        onClick={() => setShowPassPopup(true)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-700 transition-colors text-left"
                    >
                        <span>{locale('user.settings.change_password')}</span>
                    </button>
                </div>
            </div>

            {/* Download History Grid */}
            <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2 px-2 font-bold text-gray-400 text-sm uppercase">
                    <FaHistory /> {locale('user.history.download')}
                </div>
                {downloadHistory.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-1">
                        <AnimatePresence>
                            {downloadHistory.map(item => (
                                <HistoryItem key={item.id} item={item} onDownload={handleDownload} />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm mx-1">
                        No history found
                    </div>
                )}
            </div>
            <TitleFooter />
        </div>
    );
};

export default UserPage;
