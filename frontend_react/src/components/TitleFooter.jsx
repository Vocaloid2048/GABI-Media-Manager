import React from 'react';
import { useLanguage } from '../lang/LanguageContext';

const TitleFooter = () => {
    const { locale } = useLanguage();
    return (
        <footer className="mt-4 text-center text-gray-600 text-sm border-t border-gray-800/50 pt-4 pb-0">
            <p className="font-medium text-gray-500 mb-2 cursor-pointer" onClick={() => window.open("https://github.com/Vocaloid2048/GABI-Media-Manager", "_blank")}>{locale('app.title')}</p>
            <p className="cursor-pointer" onClick={() => window.open("https://github.com/Vocaloid2048")}>&copy; 2026 Vocaloid2048. {locale('footer.rights')}</p>
        </footer>
    )
}

export default TitleFooter;