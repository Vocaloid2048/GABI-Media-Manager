import React, { useState } from 'react';
import { FaGoogle, FaApple, FaFacebook } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLanguage } from '../lang/LanguageContext';
import { sha256 } from 'js-sha256';

const LoginPopup = ({ onClose, allowClose = true }) => {
  const { locale } = useLanguage();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    if (allowClose) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    setError('');

    // Regex for username: 3-20 characters, letters, numbers, underscores
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    // Regex for password: at least 8 chars, one uppercase, one lowercase, one digit
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (isRegistering) {
      if (!usernameRegex.test(username)) {
        setError(locale('login.err.username_format'));
        return;
      }
      if (!passwordRegex.test(password)) {
        setError(locale('login.err.password_format'));
        return;
      }
    }

    const endpoint = isRegistering ? '/api/user/register' : '/api/user/login';

    // Hash password before sending
    const passwordHash = sha256(password);

    const body = {
      username,
      password: passwordHash,
      ...(isRegistering && { invitation_code: invitationCode })
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.retcode === 1) {
        // Success
        localStorage.setItem('user_id', data.data.user_id);
        localStorage.setItem('username', data.data.username);
        localStorage.setItem('salt', data.data.salt);
        onClose();
        window.location.reload(); // Reload to update UI state
      } else {
        let msg = data.message;
        if (data.retcode === -1006) msg = locale('login.err.user_exists');
        else if (data.retcode === -1007) msg = locale('login.err.invalid_invitation');
        setError(msg || 'Error occurred');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-700"
      >
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          {isRegistering ? locale('login.create_account') : locale('login.welcome')}
        </h2>

        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">{locale('login.username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">{locale('login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {isRegistering && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="block text-gray-400 text-sm mb-1">{locale('login.invitation_code')}</label>
              <input
                type="text"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </motion.div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            {isRegistering ? locale('login.register') : locale('login.sign_in')}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            {isRegistering ? locale('login.have_account') : locale('login.no_account')}
          </button>
        </div>

        {false && ( /** This is for social login */
          <div>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-gray-800 text-gray-500">{locale('login.or_continue')}</span></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button className="flex justify-center items-center bg-white text-gray-900 p-3 rounded-lg hover:bg-gray-100 transition-colors"><FaGoogle className="text-xl" /></button>
              <button className="flex justify-center items-center bg-white text-gray-900 p-3 rounded-lg hover:bg-gray-100 transition-colors"><FaApple className="text-xl" /></button>
              <button className="flex justify-center items-center bg-[#1877F2] text-white p-3 rounded-lg hover:bg-[#166fe5] transition-colors"><FaFacebook className="text-xl" /></button>
            </div>
          </div>
        )}

        {allowClose && (
          <button onClick={handleClose} className="mt-8 w-full text-gray-500 hover:text-gray-300 text-sm transition-colors">{locale('common.close')}</button>
        )}
      </motion.div>
    </div>
  );
};

export default LoginPopup;
