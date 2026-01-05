import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import { LanguageProvider } from './lang/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/group/:id" element={<DetailPage />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
