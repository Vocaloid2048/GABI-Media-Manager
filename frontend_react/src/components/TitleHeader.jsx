import React from 'react';
import { FaArrowCircleLeft, FaBackward, FaPlayCircle } from 'react-icons/fa';

const TitleHeader = ({isHomePage = false}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900 text-white flex items-center px-4 z-50 shadow-md border-b border-gray-800 shadow-black/20">
      {isHomePage !== true && 
        <FaArrowCircleLeft className="text-2xl cursor-pointer absolute left-4" onClick={() => window.history.back()} />
      }
      <div onClick={() => window.location.href = '/'} className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3 cursor-pointer">
        <img src="/src/assets/gabi.webp" alt="GABI Media Manager Logo" className="h-10 w-10 rounded-full" />
        <h1 className="text-xl font-bold tracking-wider">GABI Media Manager</h1>
      </div>
    </header>
  );
};

export default TitleHeader;
