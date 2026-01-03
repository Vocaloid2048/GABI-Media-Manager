import React from 'react';
import { FaGoogle, FaApple, FaFacebook } from 'react-icons/fa';
import { motion } from 'framer-motion';

const LoginPopup = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Welcome Back</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Username</label>
            <input type="text" className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Password</label>
            <input type="password" className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-600/20">
            Sign In
          </button>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-4 bg-gray-800 text-gray-500">Or continue with</span></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button className="flex justify-center items-center bg-white text-gray-900 p-3 rounded-lg hover:bg-gray-100 transition-colors"><FaGoogle className="text-xl" /></button>
          <button className="flex justify-center items-center bg-white text-gray-900 p-3 rounded-lg hover:bg-gray-100 transition-colors"><FaApple className="text-xl" /></button>
          <button className="flex justify-center items-center bg-[#1877F2] text-white p-3 rounded-lg hover:bg-[#166fe5] transition-colors"><FaFacebook className="text-xl" /></button>
        </div>

        <button onClick={onClose} className="mt-8 w-full text-gray-500 hover:text-gray-300 text-sm transition-colors">Close</button>
      </motion.div>
    </div>
  );
};

export default LoginPopup;
