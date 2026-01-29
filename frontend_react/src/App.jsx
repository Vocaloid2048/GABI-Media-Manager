import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import LyricPage from './pages/LyricPage';
import { LanguageProvider } from './lang/LanguageContext';
import LoginPopup from './components/LoginPopup';

function App() {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      setShowLogin(true);
    }
  }, []);

  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/group/:id" element={<DetailPage />} />
          <Route path="/song/:id" element={<LyricPage />} />
        </Routes>
        {showLogin && (
          <LoginPopup 
            onClose={() => {
              const userId = localStorage.getItem('user_id');
              if (userId) setShowLogin(false);
            }} 
            allowClose={false} 
          />
        )}
      </Router>
    </LanguageProvider>
  );
}

export default App;
