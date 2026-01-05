import React from 'react';
import { useLanguage } from '../lang/LanguageContext';

export const TagTypeEnum = {
    風格: {color: "#ffc8aa", localeKey: 'filter.style'},
    景色: {color: "#d4edbc", localeKey: 'filter.scenery'},
    天氣: {color: "#bfe1f6", localeKey: 'filter.weather'},
    角度: {color: "#e6cff2", localeKey: 'filter.view'},
}

export const TagClip = ({ tagData }) => {
    const { language } = useLanguage();
    const tagName = language === 'zh' ? tagData.tag_zh_name : (tagData.tag_en_name || tagData.tag_zh_name);

    return (
        <div className="inline-block mr-2 mb-2">
            <span 
                className="text-xs font-medium px-3 py-1 rounded-full text-black"
                style={{ backgroundColor: TagTypeEnum[tagData.tag_type].color || '#777777' }}
            >
                {tagName}
            </span>
        </div>
    )
}
