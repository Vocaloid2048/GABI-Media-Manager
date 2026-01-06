import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../lang/LanguageContext';
import { FaUser, FaHistory, FaLock, FaGlobe, FaDownload } from 'react-icons/fa';
import { generateDs } from '../utils/auth';

const HistoryItem = ({ item }) => {
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
        </motion.div>
    );
};

const UserPage = () => {
    const { locale, toggleLanguage, language } = useLanguage();
    const [downloadHistory, setDownloadHistory] = useState([]);
    const [userInfo, setUserInfo] = useState({ localeName: 'Guest', username: 'guest' });
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        const username = localStorage.getItem('username');
        const userLocaleName = localStorage.getItem('locale_name');

        if (userId && username) {
            setIsLoggedIn(true);
            setUserInfo({ localeName: userLocaleName, username: username }); // Mock email for now
            fetchHistory(userId);
        } else {
            window.location.href = '/';
        }
    }, []);

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

    return (
        <div className="flex-1 overflow-y-auto bg-gray-900 text-white p-4 pb-24">
            <h2 className="text-2xl font-bold mb-6 px-2">{locale('user.profile')}</h2>

            {/* Profile Card */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6 shadow-lg flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                    <FaUser />
                </div>
                <div>
                    <h3 className="text-xl font-bold">{userInfo.localeName || userInfo.username}</h3>
                    <p className="text-gray-400 text-sm">{userInfo.username}</p>
                </div>
            </div>

            {/* Settings Section */}
            <div className="space-y-4">

                {/* Language Settings */}
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-700 font-bold text-gray-400 text-sm uppercase flex items-center gap-2">
                        <FaGlobe /> {locale('user.settings.language')}
                    </div>
                    <button
                        onClick={toggleLanguage}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-700 transition-colors text-left"
                    >
                        <span>{locale('user.settings.current_language')}</span>
                        <span className="text-blue-400 font-bold">{locale('app.lang_curr')}</span>
                    </button>
                </div>

                {/* Password / Security */}
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-700 font-bold text-gray-400 text-sm uppercase flex items-center gap-2">
                        <FaLock /> {locale('user.settings.security')}
                    </div>
                    <button className="w-full p-4 flex items-center justify-between hover:bg-gray-700 transition-colors text-left">
                        <span>{locale('user.settings.change_password')}</span>
                    </button>
                </div>
            </div>

            {/* Download History Grid */}
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-4 px-2 font-bold text-gray-400 text-sm uppercase">
                    <FaHistory /> {locale('user.history.download')}
                </div>
                {downloadHistory.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-1">
                        <AnimatePresence>
                            {downloadHistory.map(item => (
                                <HistoryItem key={item.id} item={item} />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm mx-1">
                        No history found
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserPage;
